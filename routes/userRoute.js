const express = require("express")
const router = express.Router()
const User = require("../models/userModel")
const bcryptjs = require("bcryptjs")
const jwt = require('jsonwebtoken')

router.post('/api/register', async(req,res)=> {

    const user = req.body
    try {
        const email = user.email
        const exist_user = await User.findOne({email})
        if (exist_user) {
            return res.status(400).json({message:'Utilisateur existe déjà'})
        }
        const salt = bcryptjs.genSaltSync(10)
        const hash = bcryptjs.hashSync(user.password,salt)
    
        user.password = hash
        await User.create(user)
    
        res.json({message:`L'utilsateur ${user.username} a été ajouté avec succès!`})
    } catch (error) {
        res.status(500).json({message: 'Server error'});
      }
})

// Route login pour la connexion
router.post('/api/login', async(req,res) => {

    // Extraction des informations 'email' et 'password' du corps de la requête
    const {email,password} = req.body
    
    // Recherche dans la base de données d'un utilisateur avec l'email fourni
    const user = await User.findOne({email})

    // Si l'utilisateur existe
    if (user) {

        // Comparaison du mot de passe envoyé avec celui stocké dans la base de données (haché)
        const isMatch = bcryptjs.compareSync(password,user.password)

        // Si les mots de passe correspondent
        if (isMatch) {

            // Envoi du token dans un cookie HTTP, avec quelques options de sécurité
            const token = jwt.sign({id:user._id, role: user.role}, process.env.JWT_SECRET)
            res.cookie('token', token, {
                httpOnly: true, // Empêche l'accès au cookie via Javascript, pour des raisons de sécurité
                secure: false, // Mettre true en production si le site utilise HTTPS
                sameSite: 'none', // Permet au cookie d'être utilisé dans des requêtes cross-site
                maxAge:60*60*1000 // Durée de conservation du token
            }).json({token, role:user.role, id:user._id}) // Reponse JSON contenant le token et le rôle de l'utilisateur

        } else {
            // Si le mot de passe ne correspondent pas, renvoyer un message d'erreur
            res.json({message:'Email ou mot de passe incorrect'})
        }
    } else {
        // Si l'utilisateur avec cet email n'existe pas, renvoyer un message indiquant que l'utilisateur n'a pas été trouvé
    res.json({message: "User not found"})
    }
});

// Seconde méthode pour envoyer le token

// Route protégée - envoie du token avec le headers (en-tête)
// router.get('/api/user', async (req, res) => {
//     try {
//         // Récupérer le header Authorization
//         const authHeader = req.headers['authorization'];

//         // Vérifier si l'en-tête Authorization est présent
//         if (!authHeader) {
//             return res.status(401).json({ message: 'Accès non autorisé. Aucun token fourni.' });
//         }

//         // Extraire le token du header Authorization (format: "Bearer <token>")
//         const token = authHeader.split(' ')[1];

//         // Vérifier si le token est présent
//         if (!token) {
//             return res.status(401).json({ message: 'Token non valide ou manquant.' });
//         }

//         // Vérifier et décoder le token de manière asynchrone
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Si la vérification réussit, récupérer les utilisateurs
//         const users = await User.find();

//         // Si aucun utilisateur n'est trouvé
//         if (users.length === 0) {
//             return res.status(404).json({ message: 'Aucun utilisateur trouvé.' });
//         }

//         // Renvoyer la liste des utilisateurs
//         return res.json(users);

//     } catch (err) {
//         // Gérer les erreurs JWT (ex: token expiré, invalide)
//         if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
//             return res.status(403).json({ message: 'Token invalide ou expiré.' });
//         }
//         // Gérer d'autres erreurs (par exemple, erreurs de base de données)
//         return res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
//     }
// });

// Supprimer un utilisateur
router.delete('/api/user/:id', async (req, res) => {
    try {
        // Récupérer le token à partir du cookie
        const token = req.cookies.token;

        // Si le token n'est pas présent, renvoyer une réponse d'erreur
        if (!token) {
            return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
        }

        // Vérifier et décoder le token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                // Si le token est invalide ou expiré, renvoyer une réponse d'erreur
                return res.status(401).json({ message: 'Token invalide ou expiré.' });
            }

            // Récupérer l'ID de l'utilisateur à supprimer à partir de req.params
            const id = req.params.id

            // Vérifier si l'utilisateur est un admin ou si c'est lui-même qui effectue l'action
            if (decoded.role === 'admin' || decoded.id === id) {
                // Si le rôle est 'admin' ou si l'utilisateur lui-même veut se supprimer, procéder à la suppression
                const user = await User.findByIdAndDelete(id);

                if (!user) {
                    return res.status(404).json({ message: "Utilisateur non trouvé." });
                }

                return res.json({ message: "Utilisateur supprimé avec succès." });
            } else {
                // Si l'utilisateur n'est ni un admin ni lui-même, refuser l'accès
                return res.status(403).json({ message: "Accès refusé. Vous n'avez pas les permissions pour supprimer cet utilisateur." });
            }
        });

    } catch (error) {
        // Gérer les erreurs éventuelles
        return res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
});

router.get('/api/user', async(req,res)=> {
    const users = await User.find()
    res.json(users)
})

module.exports = router