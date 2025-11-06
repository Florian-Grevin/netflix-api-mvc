export function assignGenres(movie, genres) {
    const genreNames = Array.isArray(movie.genre_ids) && genres ? movie.genre_ids.map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? genre.name : "?";
    }).join(', '): "Genres inconnus";
    return genreNames;
}

export function assignLang(movie, genres, lang) {
  return lang ? (lang.find(l => l.iso_639_1 === movie.original_language)?.english_name || "Inconnu") : "Langue inconnue";
}

export function createMovieCard(movie, genres, lang, isTemplate=false, adult) { //passage de genres en paramètres pour ne pas faire un import

  const movieElement = document.createElement('div');
  //si on a le filtre adult et qu'on tombe sur un filtre adule, alors ce film sera retiré de la génération 
  //marche pas dans le query
  if(movie.adult && !adult) {
    movieElement.classList.add("hidden");
    return movieElement;
  }
  else movieElement.classList.remove("hidden");
  movieElement.classList.add('movie-card', 'cursor-pointer', 'h-full');
  movieElement.id = movie.id;

  //Prop Tailwind CSS
  const mainDivCss = "movie-wrapper h-full bg-zinc-900 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300";
  const imgCss = "w-full h-60 object-cover select-none"
  const secondDivCss = "text-white h-1/2 p-4 text-white";
  const thirdDivCss = "movie-text-wrapper flex flex-col justify-between items-center text-center h-full min-h-[200px] overflow-hidden";
  const hTwoCss = "text-lg font-semibold mb-2 min-h-[3em] leading-[1.5] flex items-center justify-center text-center break-words";
  const pCss = "text-sm min-h-[3em] mb-2 break-words";
  const ftBold = "font-bold";

  if(!isTemplate) { //To do en faire une fonction et l'importer dans movie controller?
    const genreNames = assignGenres(movie, genres);
    const languageName = assignLang(movie, genres, lang);

    movieElement.innerHTML = `
      <div class="${mainDivCss}">
        <div class="relative">
          ${movie.adult ? '<img src="assets/plus-18.svg" alt="Réservé aux adultes" width="64" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1]">' :''}
          <img src="https://image.tmdb.org/t/p/w500${movie.backdrop_path}" alt="Preview de ${movie.id}" class="${imgCss} ${movie.adult ? "filter blur-md": " "}"/>
        </div>
          <div class="${secondDivCss}">
          <div class="${thirdDivCss}">
          <h2 class="${hTwoCss}" id="${movie.id}">${movie.title}</h2>
          <p class="${pCss}"><span class="${ftBold}">Langue originale:</span></br> ${languageName} </p>
          <p class="${pCss}"><span class="${ftBold}">Genres:</span></br> ${genreNames}</p>
          </div>
        </div>
      </div>
    `;
  }
  else {
  movieElement.innerHTML = `
        <div class="${mainDivCss}">
        <span class="block ${imgCss}"></span>
        <div class="${secondDivCss}">
            <div class="${thirdDivCss}">
            <h2 class="${hTwoCss}">Chargement...</h2>
            <p class="${pCss}"><span class="${ftBold}">Langue originale:</span><br> ... </p>
            <p class="${pCss}"><span class="${ftBold}">Genres:</span><br> ...</p>
            </div>
        </div>
      </div>
    `;
  }

  return movieElement;
}

export function highlightMovieCard(cardElement) {
    cardElement.classList.add('ring-2', 'ring-red-500');
}