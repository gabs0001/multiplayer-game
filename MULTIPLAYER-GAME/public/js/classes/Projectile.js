class Projectile {
  constructor({
    position,
    radius, 
    color = 'white',
    velocity
  }) {
    this.position = position
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    c.beginPath()
    c.arc(
      this.position.x, 
      this.position.y, 
      this.radius, 
      0, 
      Math.PI * 2, false
    )
    c.fillStyle = this.color
    c.fill()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.position.y + this.velocity.y
  }
}
