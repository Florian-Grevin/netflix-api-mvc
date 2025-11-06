/**
 * Modèle Movie pour structurer les données
 */
export class MovieModel {
    constructor(data, speciesData = null) {

        this.adult = data.adult;
        this.backdrop_path = data.backdrop_path;
        this.genre_ids = data.genre_ids;
        this.id = data.id;
        this.original_language = data.original_language;
        this.original_title = data.original_title;
        this.overview = data.overview;
        this.popularity = data.popularity;
        this.poster_path = data.poster_path;
        this.release_date = data.release_date;
        this.title = data.title;
        this.video = data.video;
        this.vote_average = data.vote_average;
        this.vote_count = data.vote_count;
    }
}
