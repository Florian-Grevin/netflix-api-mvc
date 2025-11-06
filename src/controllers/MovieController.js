import { MovieModel } from '../models/MovieModel.js';
import { MovieService } from '../services/MovieService.js';
import { createMovieCard, assignGenres, assignLang } from '../components/MovieCard.js';

/**
 * Contrôleur principal pour gérer la logique de l'application
 */
export class MovieController {
    constructor() {
        this.service = new MovieService();
        this.movieList = [];
        this.genresList = [];
        this.combinedResults = [];
        this.langList = [];

        //Paramètres d'url
        this.url = new URL(window.location.href);
        this.currentPage = parseInt(this.url.searchParams.get('page'), 10) || 1;
        this.adult = this.url.searchParams.get('adult') || false;
        this.lang = "en-US";
        this.sortBy = "popularity.desc";
        
        this.minPage = 1;
        this.maxPage = 500;

        // Éléments DOM
        this.searchInput = document.getElementById('searchInput');
        this.checkNsfw = document.getElementById('checkNsfw');
        this.loadingAnim = document.getElementById('loading');
        this.listingMovie = document.getElementById('listing-movie');
        this.pageNav = document.getElementById('page-nav');
        this.pageNavBtn = document.querySelectorAll('#page-nav button');
        this.prevPage = document.getElementById('page-prev');
        this.nextPage = document.getElementById('page-next');
        this.onPage = document.getElementById('page-current');
        this.warning = document.getElementById('warning');
        this.movieModal = document.getElementById('movie-modal');

        this.initEventListeners();
        this.updatePage();
    }

    updatePage(page) {
        this.url = new URL(window.location.href);
        let pageParam = parseInt(this.url.searchParams.get('page'), 10);

        // Si page est défini (par les boutons ou input), on l'utilise
        if (typeof page !== 'undefined') {
            this.currentPage = page;
        } else {
            // Sinon, on lit depuis l'URL
            this.currentPage = (!isNaN(pageParam) && pageParam >= this.minPage && pageParam <= this.maxPage) ? pageParam : this.minPage;
        }

        this.url.searchParams.set('page', this.currentPage);
        this.url.searchParams.set('adult', this.adult);
        this.url.searchParams.set('lang', this.lang);
        this.url.searchParams.set('sortBy', this.sortBy);
        window.history.replaceState({}, '', this.url.toString());

        this.onPage.value = this.currentPage;
        this.loadMovie();
    }
    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {

        // Recherche avec debounce
        let searchTimeout;
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();

            clearTimeout(searchTimeout);

            if (value.length > 3) {
                this.warning.classList.add("hidden");
                searchTimeout = setTimeout(() => {
                    this.handleSearch(value);
                }, 300);
            } else {
                this.warning.classList.remove("hidden");e
                this.pageNav.classList.remove("hidden");
                this.listingMovie.innerHTML = '';
                this.updatePage(this.currentPage);
            }
        });

        // Filter NSFW
        this.checkNsfw.addEventListener('click', () => {
            this.adult = this.checkNsfw.checked.toString();
            this.updatePage(this.currentPage);
        });
        
        this.pageNavBtn.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if(btn == this.prevPage && this.currentPage > this.minPage) { // Bouton Page précédente
                    this.currentPage--;
                }
                else if (btn == this.nextPage && this.currentPage < this.maxPage) { // Bouton Page suivante
                    this.currentPage++;
                }
                this.updatePage(this.currentPage);
            });
        });

        //Commande Clavier
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.currentPage > this.minPage) {
                this.currentPage--;
            } else if (e.key === 'ArrowRight' && this.currentPage < this.maxPage) {
                this.currentPage++;
            }
            this.updatePage(this.currentPage);
        });

        //Page Spécifique
        this.onPage.addEventListener('input', (event) => {
            const value = parseInt(event.target.value, 10);

            if (!isNaN(value) && value >= this.minPage && value <= this.maxPage) {
                this.currentPage = value;
                this.updatePage(this.currentPage); // Synchroniser l’URL et recharger
            }
        });

        //Ouvrir le modal au clic d'un film
        document.getElementById('listing-movie').addEventListener('click', (e) => {
            const card = e.target.closest('.movie-card');
            if (card) this.openModal(card);
        });


        // Fermer le modal en cliquant sur le fond
        document.getElementById('movie-modal').addEventListener('click', (e) => {
            if (e.target.id === 'movie-modal') {
                this.closeModal();
            }
        });
        document.getElementById('modal-close').addEventListener('click', (e) => {
            if (e.target.id === 'modal-close') {
                this.closeModal();
            }
        });
    }

    /**
     * Initialise l'application
     */
    async init() {
        //await this.loadMovie();
        if(this.adult) this.checkNsfw.checked = true;
    }

    /**
     * Charge la liste des Films
     */
    async loadMovie() {
        
        if (this.loading) return;
        this.loading = true;
        this.renderMovies();
        try {
            const data = await this.service.getMoviesList(this.currentPage, this.adult, this.lang, this.sortBy);
            const genreData = await this.service.getGenreDetails(); // On recupère genre depuis le service
            const langData = await this.service.getLangDetails();
            
            const moviesData = data.results;
            this.genresList = genreData.genres;
            this.langList = langData;

            if (!Array.isArray(moviesData)) {
                console.error('Les données reçues ne sont pas un tableau :', moviesData);
            return;
            }

            this.listingMovie.innerHTML = ``;

            // Créer les objets Films avec des données tout en s'assurant qu'on a pas de doublons
            const existingIds = new Set(this.movieList.map(movie => movie.id));
            const movies = moviesData
            .map((p, index) => new MovieModel(p, genreData[index]))
            .filter(movie => !existingIds.has(movie.id));

            this.movieList = [...this.movieList, ...movies];
            this.renderMovies(moviesData, this.genresList, this.langList);

        } catch (error) {
            console.error(error);
        }
        finally {
            this.loading = false;
        }
    }

    /**
     * Affiche les Films dans la grille
     * @param {Array<Movies>} movies - Liste de Films à afficher
     */
    renderMovies(movies= "", genres = "", lang = "") {

        //this.listingMovie.innerHTML = "";

        if (!Array.isArray(movies) || movies.length === 0) {
            // Afficher les templates vides
            for (let i = 0; i < 20; i++) {
                const card = createMovieCard(movies, genres, lang, true);
                this.listingMovie.appendChild(card);
            }
        }
        else {
            // Afficher les films
            movies.forEach((movie) => {
                const card = createMovieCard(movie, genres, lang, false, this.adult);
                this.listingMovie.appendChild(card);
            });            
        }

    }

    /**
     * Ouvre le modal avec les détails du Film
     * @param {Movie} movie - film à afficher
     */
    async openModal(card) {
        const movieId = parseInt(card.id);
        const movie = this.movieList.find(m => m.id === movieId) ||
                      this.combinedResults.find(m => m.id === movieId);

        console.log(movie.release_date);

        const spanSt = `<span class="font-bold">`;
        const spanEd = `</span>`;

        if (movie) {
            document.getElementById('modal-title').textContent=movie.title;
            document.getElementById('modal-image').src = "https://image.tmdb.org/t/p/w500" + movie.backdrop_path;
            document.getElementById('modal-language').innerHTML=`${spanSt}Language: ${spanEd} ${assignLang(movie, "", this.langList)}`;
            document.getElementById('modal-genres').innerHTML=`${spanSt}Genres: ${spanEd} ${assignGenres(movie, this.genresList)}`;
            document.getElementById('modal-overview').innerHTML=`${spanSt}Synopsis: ${spanEd} ${movie.overview}`;
        }
        else {
            console.warn("Film non trouvé pour l'id :", movieId);
        }

        this.movieModal.classList.remove('hidden');
    }

    /**
     * Ferme le modal
     */
    closeModal() {
        this.movieModal.classList.add('hidden');
    }

    /**
     * Gère la recherche de Films
     * @param {string} query - Terme de recherche
     */
   async handleSearch(query) {
    this.listingMovie.innerHTML = '';
    this.pageNav.classList.add("hidden");

    if (!query.trim()) {
        this.pageNav.classList.remove("hidden");
        this.listingMovie.innerHTML = '';
        this.updatePage(this.currentPage);
        return;
    }

    //Normaisation du texte
    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedQuery = normalize(query);

    // Recherche locale
    const localResults = this.movieList.filter(movie =>
        normalize(movie.title).includes(normalizedQuery) ||
        movie.id.toString().includes(query)
    );

    if (localResults.length > 0) {
        this.renderMovies(localResults, this.genresList, this.langList);
    }

    this.loadingAnim.classList.remove("hidden");

    try {
        console.log('Recherche dans l\'API en cours...');
        const apiResults = await this.service.searchMovie(query, this.adult);

        // Création du genreMap
        const genreMap = {};
        this.genresList.forEach(g => {
            genreMap[g.id] = g.name;
        });

        // Transformation des résultats API
        const newMovies = [];
        for (const p of apiResults) {
            const genreNames = Array.isArray(p.genre_ids)
                ? p.genre_ids.map(id => genreMap[id])
                : [];

            const movie = new MovieModel(p, genreNames);

            // Vérifie si le film est déjà dans les résultats locaux
            if (!localResults.some(m => m.id === movie.id)) {
                this.renderMovies([movie], this.genresList, this.langList);
            }

            newMovies.push(movie);
        }


        // Fusion des deux listes sans doublons
        const seenIds = new Set();
        this.combinedResults = [];
        this.combinedResults = [...localResults, ...newMovies].filter(movie => {
            if (seenIds.has(movie.id)) return false;
            seenIds.add(movie.id);
            return true;
        });

        if (this.combinedResults.length > 0) {
            this.listingMovie.innerHTML = '';

            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            this.renderMovies(this.combinedResults, this.genresList, this.langList);
        } else {
            this.listingMovie.innerHTML = `<p class="col-span-full text-center text-gray-500">Aucun Film Trouvé</p>`;
        }

    } catch (error) {
        console.error('Erreur lors de la recherche dans l\'API :', error);
        this.showError(this.languageService.t('searchError'));
    } finally {
        this.loadingAnim.classList.add("hidden");
    }
   }

}