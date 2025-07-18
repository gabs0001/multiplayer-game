const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const usernameForm = document.getElementById('usernameForm')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio)

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('updateProjectiles', backEndProjectiles => {
  for(const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id]

    if(!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        position: {
          x: backEndProjectile.x,
          y: backEndProjectile.y
        },
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: {
          x: backEndProjectile.velocity.x,
          y: backEndProjectile.velocity.y
        }
      })
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
    }
  }
  
  for(const frontEndProjectileId in frontEndProjectiles) {
    if(!backEndProjectiles[frontEndProjectileId]) delete frontEndProjectiles[frontEndProjectileId]
  }
})

socket.on('updatePlayers', backEndPlayers => {
  for(const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id]
    
    if(!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        position: {
          x: backEndPlayer.x,
          y: backEndPlayer.y
        },
        radius: 10,
        color: backEndPlayer.color
      })

      document.getElementById('playerLabels').innerHTML += `
      <div data-id="${id}" data-score="${backEndPlayer.score}">
        ${backEndPlayer.username}: ${backEndPlayer.score}
      </div>`
    } else {
      document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backEndPlayer.username}: ${backEndPlayer.score}`
      document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backEndPlayer.score)

      //ordena as divs pela pontuação
      const parentDiv = document.getElementById('playerLabels')
      const childDivs = Array.from(parentDiv.querySelectorAll('div'))
      
      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'))
        const scoreB = Number(b.getAttribute('data-score'))
        return scoreB - scoreA
      })

      //remove os elementos
      childDivs.forEach(div => parentDiv.removeChild(div))

      //adiciona os elementos em ordem baseado na pontuação
      childDivs.forEach(div => parentDiv.appendChild(div))

      if(id === socket.id) {
        //se o player já existir
        frontEndPlayers[id].x = backEndPlayer.x
        frontEndPlayers[id].y = backEndPlayer.y

        const lastBackendInputIndex = playerInputs.findIndex(input => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if(lastBackendInputIndex > -1) playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach(input => {
          frontEndPlayers[id].x += input.dx
          frontEndPlayers[id].y += input.dy
        })
      } else {
        //para todos os outros players
        gsap.to(frontEndPlayers[id], {
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
    }
  }

  //removendo o player
  for(const id in frontEndPlayers) {
    if(!backEndPlayers[id]) {
      const divToDelete = document.querySelector(`div[data-id="${id}"]`)
      divToDelete.parentNode.removeChild(divToDelete)

      if(id === socket.id) usernameForm.style.display = 'block'
      
      delete frontEndPlayers[id]
    }
  }
})

let animationId
const animate = () => {
  animationId = requestAnimationFrame(animate)
  // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  // c.fillRect(0, 0, canvas.width, canvas.height)
  c.clearRect(0, 0, canvas.width, canvas.height)
  
  for(const id in frontEndPlayers) {
    const frontEndPlayer = frontEndPlayers[id]
    frontEndPlayer.draw()
  }

  for(const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id]
    frontEndProjectile.draw()
  }
}

animate()

const keys = {
  w: { pressed: false },
  a: { pressed: false },
  s: { pressed: false },
  d: { pressed: false }
}

const speed = 10
const playerInputs = []
let sequenceNumber = 0

setInterval(() => {
  if(keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({
      sequenceNumber,
      dx: 0,
      dy: -speed
    })
    frontEndPlayers[socket.id].y -= speed
    socket.emit('keydown', {
      keycode: 'KeyW',
      sequenceNumber
    })
  } 
  
  if(keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({
      sequenceNumber,
      dx: -speed,
      dy: 0
    })
    frontEndPlayers[socket.id].x -= speed
    socket.emit('keydown', {
      keycode: 'KeyA',
      sequenceNumber
    })
  }
  
  if(keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({
      sequenceNumber,
      dx: 0,
      dy: speed
    })
    frontEndPlayers[socket.id].y += speed
    socket.emit('keydown', {
      keycode: 'KeyS',
      sequenceNumber
    })
  }
  
  if(keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({
      sequenceNumber,
      dx: speed,
      dy: 0
    })
    frontEndPlayers[socket.id].x += speed
    socket.emit('keydown', {
      keycode: 'KeyD',
      sequenceNumber
    })
  }
}, 15)

addEventListener('keydown', ({ code }) => {
  if(!frontEndPlayers[socket.id]) return
  switch(code) {
    case 'KeyW':
      keys.w.pressed = true
    break
    case 'KeyA':
      keys.a.pressed = true
    break
    case 'KeyS':
      keys.s.pressed = true
    break
    case 'KeyD':
      keys.d.pressed = true
    break
  }
})

addEventListener('keyup', ({ code }) => {
  if(!frontEndPlayers[socket.id]) return
  switch(code) {
    case 'KeyW':
      keys.w.pressed = false
    break
    case 'KeyA':
      keys.a.pressed = false
    break
    case 'KeyS':
      keys.s.pressed = false
    break
    case 'KeyD':
      keys.d.pressed = false
    break
  }
})

usernameForm.addEventListener('submit', (event) => {
  event.preventDefault()
  usernameForm.style.display = 'none'
  const usernameInput = document.getElementById('usernameInput').value
  socket.emit('initGame', {
    username: usernameInput,
    width: canvas.width,
    height: canvas.height,
  })
})
