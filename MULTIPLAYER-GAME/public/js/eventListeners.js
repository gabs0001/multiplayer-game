addEventListener('click', ({ clientX, clientY }) => {
  const canvas = document.querySelector('canvas')
  const {top, left} = canvas.getBoundingClientRect()
  
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y,
  }

  const angle = Math.atan2(
    (clientY - top) - playerPosition.y,
    (clientX - left) - playerPosition.x
  )
  
  socket.emit('shoot', {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
  })
})