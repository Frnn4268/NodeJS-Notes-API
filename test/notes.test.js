const mongoose = require('mongoose')

const { server } = require('../index')

const Note = require('../models/Note')
const { api, initialNotes, getAllContentFromNotes } = require('../helpers/helpers.js')

beforeEach(async () => {
  await Note.deleteMany({})

  for (const note of initialNotes) { // Sequential
    const noteObject = new Note(note)
    await noteObject.save()
  }
})

describe('GET all notes', () => {
  test('Notes are return as json', async () => {
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('There are five notes', async () => {
    const response = await api.get('/api/notes')
    expect(response.body).toHaveLength(initialNotes.length)
  })

  test('The first note is about supertest (GET)', async () => {
    const response = await api.get('/api/notes')

    const contents = response.body.map(note => note.content)
    expect(contents).toContain('This is a Mongo DB Test using supertest')
  })
})

describe('POST notes', () => {
  test('A valid note can be added (POST)', async () => {
    const newNote = {
      content: 'Soon async/await',
      important: true
    }

    await api
      .post('/api/notes')
      .send(newNote)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/notes')

    const contents = response.body.map(note => note.content)

    expect(response.body).toHaveLength(initialNotes.length + 1)
    expect(contents).toContain(newNote.content)
  })

  test('A invalid note can´t be added (POST)', async () => {
    const newNote = {
    }

    await api
      .post('/api/notes')
      .send(newNote)
      .expect(400)

    const response = await api.get('/api/notes')

    expect(response.body).toHaveLength(initialNotes.length)
  })
})

describe('DELETE notes', () => {
  test('A note can be deleted', async () => {
    const { response: firstResponse } = await getAllContentFromNotes()
    const { body: notes } = firstResponse
    const noteToDelete = notes[0]

    await api
      .delete(`/api/notes/${noteToDelete.id}`)
      .expect(204)

    const { contents, response: secondResponse } = await getAllContentFromNotes()

    expect(secondResponse.body).toHaveLength(initialNotes.length - 1)

    expect(contents).not.toContain(noteToDelete.content)
  })

  test('A note can´t be deleted', async () => {
    await api
      .delete('/api/notes/1234')
      .expect(204)

    const { response } = await getAllContentFromNotes()

    expect(response.body).toHaveLength(initialNotes.length)
  })
})

afterAll(() => {
  server.close()
  mongoose.connection.close()
})
