const express = require('express')
const app = express()

const http = require('http')
const server = http.createServer(app)
const {Server} = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000 })

const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html') })

const backEndPlayers = {}
const backEndProjectiles = {}

const speed = 10
const radius = 10
let projectileId = 0

io.on('connection', socket => {
  //emite o evento para todos os players que estiverem conectados
  io.emit('updatePlayers', backEndPlayers)

  //atira os projeteis
  socket.on('shoot', ({ x, y, angle }) => {
    projectileId++

    const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5
    }

    backEndProjectiles[projectileId] = { 
      x, 
      y, 
      velocity,
      playerId: socket.id
    }
  })

  socket.on('initGame', ({ username, width, height }) => {
    //cria um novo player
    backEndPlayers[socket.id] = {
      x: 1024 * Math.random(),
      y: 576 * Math.random(),
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username
    }

    //inicializando o canvas
    backEndPlayers[socket.id].canvas = { 
      width, 
      height 
    }
    backEndPlayers[socket.id].radius = radius
  })

  //remove o player no backend ao ser desconectado
  socket.on('disconnect', () => {
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({keycode, sequenceNumber}) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch(keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= speed
      break
      case 'KeyA':
        backEndPlayers[socket.id].x -= speed
      break
      case 'KeyS':
        backEndPlayers[socket.id].y += speed
      break
      case 'KeyD':
        backEndPlayers[socket.id].x += speed
      break
    }
  })
})

setInterval(() => { 
  //atualizando a posição dos projeteis
  for(const id in backEndProjectiles) {
    backEndProjectiles[id].x += backEndProjectiles[id].velocity.x
    backEndProjectiles[id].y += backEndProjectiles[id].velocity.y

    //removendo os projeteis após sairem do limite da tela
    const projectile_radius = 5

    if(backEndPlayers[backEndProjectiles[id].playerId]) { //linha de código adicional
      if(
        //direita e esquerda
        backEndProjectiles[id].x - projectile_radius >= 
        backEndPlayers[backEndProjectiles[id].playerId].canvas.width ||
        backEndProjectiles[id].x + projectile_radius <= 0 ||
        //cima e baixo
        backEndProjectiles[id].y - projectile_radius >= 
        backEndPlayers[backEndProjectiles[id].playerId].canvas.height ||
        backEndProjectiles[id].y + projectile_radius <= 0
      ) {
        delete backEndProjectiles[id]
        continue
      }
    }//linha de código adicional

    for(const playerId in backEndPlayers) {
      const backEndPlayer = backEndPlayers[playerId]
      
      const distance = Math.hypot(
        backEndProjectiles[id].x - backEndPlayer.x,
        backEndProjectiles[id].y - backEndPlayer.y,
      )
      //colisão do projetil com o player
      if(
        distance < projectile_radius + backEndPlayer.radius &&
        backEndProjectiles[id].playerId !== playerId
      ) {
        if(backEndPlayers[backEndProjectiles[id].playerId]) backEndPlayers[backEndProjectiles[id].playerId].score++
        delete backEndProjectiles[id]
        delete backEndPlayers[playerId]
        break
      }
    }
  }
  
  io.emit('updateProjectiles', backEndProjectiles)
  io.emit('updatePlayers', backEndPlayers) 
}, 15)

server.listen(port, () => { console.log(`App listening on port ${port}`) })