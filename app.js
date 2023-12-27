const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'moviesData.db')

const app = express()
app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at https://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertMovieObjetToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

const convertDirectorObjectToResponseObject = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}
app.get('/movies/', async (request, response) => {
  const getMovieQuery = `SELECT 
          movie_name
     FROM
         movie;
     `
  const moviesArray = await db.all(getMovieQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

app.get('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `
    SELECT 
      *
    FROM
      movie 
    WHERE
       movie_id = ${movieId};
    `
  const movie = await db.get(getMovieQuery)
  response.send(convertMovieObjetToResponseObject(movie))
})

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const postMovieQuery = `
        INSERT INTO
            movie(director_id,movie_name,lead_actor)
        VALUES
            (${directorId},'${movieName}','${leadActor}');`
  await db.run(postMovieQuery)
  response.send('Movie Successfully Added')
})

app.put('/movies/:movieId', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body
  const {movieId} = request.params
  const updateMovieQuery = `
         UPDATE
            movie
         SET
            director_id = ${directorId},
            movie_name='${movieName}',
            lead_actor= '${leadActor}'
         WHERE
            movie_id = ${movieId};`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const getDeleteQuery = `
      DELETE FROM
        movie 
      WHERE
        movie_id = ${movieId};`
  await db.run(getDeleteQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const getDirectorQuery = `SELECT 
          *
     FROM
         director;`
  const directorArray = await db.all(getDirectorQuery)
  response.send(
    directorArray.map(eachDirector =>
      convertDirectorObjectToResponseObject(eachDirector),
    ),
  )
})

app.get('/directors/:directorId/movies', async (request, response) => {
  const {directorId} = request.params
  const getDirector = `
      SELECT 
        movie_name
      FROM
        movie
      WHERE 
        director_id = ${directorId};`

  const moviesArray = await db.all(getDirector)
  response.send(
    moviesArray.map(eachMovie => ({
      movieName: eachMovie.movie_name,
    })),
  )
})
module.exports = app
