    // Importation des librairies (packages)
    const express = require('express')
    const mongoose = require('mongoose')
    const cors = require ('cors')
    const userRoute = require('./routes/userRoute')
    const cookieParser = require('cookie-parser')
    require('dotenv').config()

    // Créer une instance d'apllication Express
    const app = express()
    // Midleware pour traiter les requêtes Json
    app.use(express.json())
    app.use(cors({origin:'http://localhost:4000', credentials:true}))
    app.use(cookieParser())

    // Importer la route user
    app.use('', userRoute)

    // Démarrer le serveur sur le port 4000
    app.listen(4000)
    app.use(cors())
   
    // Connexion à mongoDB
    mongoose.connect(process.env.MONGO_URL)
    .then(()=> console.log('Connected'))
    .catch((e)=>console.log('Error', e))

    // Création du schéma
    const postSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
    }, {timestamps:true})

    // Création du model
    const Post = mongoose.model('Post', postSchema)

    app.post('/api/article', async(req,res) => {
        const article = req.body
        await Post.create(article)
        res.json({message:"Un article a été ajouté avec succès !"})
    })

    app.get('/api/article', async(req,res) => {
        const articles = await Post.find()
        res.json(articles)
    })

    app.put('/api/article/:id', async(req,res) => {
        const {id} = req.params
        const article = req.body
        await Post.findByIdAndUpdate(id,article)
        res.json({message:"Un article a été mis à jour !"})
    })

    app.get('/api/article/:id', async(req,res) => {
        const {id} = req.params
        const article = await Post.findById(id)
        res.json(article)
    })

    app.delete('/api/article/:id', async(req,res) => {
        const {id} = req.params
        await Post.findByIdAndDelete(id)
        res.json({message:`Un article dont l'id est ${id} a été supprimé !`})
    })