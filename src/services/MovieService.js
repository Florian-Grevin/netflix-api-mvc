/**
 * Service pour gérer les appels à l'API
 */
const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2NDhjNWU1ZWMyYWJhOGViYjFiNDQ0ZTcyYmVhZTk3ZSIsIm5iZiI6MTc2MDUyOTMzNC41MjEsInN1YiI6IjY4ZWY4YmI2OTZlMmFkNmUwY2YwYTI2ZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ZEBl14IDXLFvkSRAFYmYu8rHNIUyP2EqPz3BzHxyTnc'
  }
};


export class MovieService {
    constructor() {
        this.baseUrl = 'https://api.themoviedb.org/3/';
        this.cache = new Map();
    }

    async getMoviesList(page=1, adult, lang, sortBy) {
        const cat = 'discover';
        const type = 'movie'
        const hasVid = false;
        const cacheKey = `list_${cat}_${type}_${page}_${adult}`;

        if (this.cache.has(cacheKey)) {
            //console.log("Using cache of " + cacheKey);
            return this.cache.get(cacheKey);
        }
        //console.log(`Fetching content of list_${cat}_${type}`);

        try {
            const response = await fetch(`${this.baseUrl}${cat}/${type}?include_adult=${adult}&include_video=${hasVid}&language=${lang}&page=${page}&sort_by=${sortBy}`,
            options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de la liste des films:', error);
            throw error;
        }
    }

    /**
     * Récupère le genre d'un film spécifique
     * @param {string|number} id - ID du genre
     * @returns {Promise<Object>} Object Array genres
     */
    async getGenreDetails(id,language="en") {
        const cacheKey = `genre_${id}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey); 
        }

        try {
            const response = await fetch(`${this.baseUrl}genre/movie/list?language=${language}`,
            options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            //console.log(data);
            return data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du Genre ${id}:`, error);
            throw error;
        }
    }

    /**
     * Récupère la langue d'un film spécifique
     * @param {string|number} id - ID de langue
     * @returns {Promise<Object>} Object Array lang
     */
    async getLangDetails(id,language="en") {
        const cacheKey = `lang_${id}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey); 
        }

        try {
            const response = await fetch(`${this.baseUrl}/configuration/languages`,
            options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            //console.log(data);
            return data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du Genre ${id}:`, error);
            throw error;
        }
    }

    /**
     * Recherche des Films par noms
     * @param {string} query - Terme de recherche
     * @returns {Promise<Array>} Liste de Films correspondants
     */   
    async searchMovie(query, adult) {
        let page = 1;
        let allResults = [];
        let totalPages = 1;
        let urlQuery = encodeURIComponent(query); //on converti en format d'url

        try {
            do {
                const response = await fetch(`${this.baseUrl}search/movie?query=${urlQuery}&include_adult=${adult}&language=en-US&page=${page}`, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                };

                const data = await response.json();
                allResults.push(...data.results);
                totalPages = data.total_pages;
                page++;
            } while (page <= totalPages);

            return allResults;
        } catch (error) {
            console.error('Erreur lors de la recherche de films:', error);
            throw error;
        }
    }
}