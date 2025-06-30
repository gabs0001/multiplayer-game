class Player {
  constructor({
    position, 
    radius, 
    color
  }) {
    this.position = position
    this.radius = radius
    this.color = color
  }

  draw() {
    c.save()
    c.beginPath()
    c.arc(
      this.position.x, 
      this.position.y, 
      this.radius, 
      0, 
      Math.PI * 2, 
      false
    )
    c.fillStyle = this.color
    c.fill()
    c.restore() //5:24:16
  }
}
