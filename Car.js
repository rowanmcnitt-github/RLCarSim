class Car
{
  constructor(position, config)
  {
    this.start_pos = createVector(position.x, position.y)
    this.position = position
    this.velocity = createVector(0, 0)
    this.acceleration = createVector(0, 0)
    this.angle = PI/2

    this.sz = config['sz']
    this.wheelSize = config['wheelSize']
    this.bodyColor = config['bodyColor']
    this.speed = config['speed'] //acceleration speed
    this.maxSpeed = config['maxSpeed'] //10
    this.steerSpeed = config['steerSpeed'] //5
    this.dragConstant = config['drag'] // 0.98
    this.numRays = config['numRays'] // 5
    this.rayLength = config['rayLength'] // 80

    this.maxAngle = radians(50)

    this.steer = 0
    this.angularVelocity = 0

    this.rays = [] // pairs of PVectors
  }
  update(input_dictionary, time_step)
  {
    if(input_dictionary == undefined){return}
    let lr_input = input_dictionary['right'] - input_dictionary['left']
    let ud_input = input_dictionary['up'] - input_dictionary['down']
    
    lr_input == 0 ? this.steer /= 1.1 : this.steer = min(max(this.steer + lr_input * time_step * this.steerSpeed, -this.steerSpeed), this.steerSpeed)

    this.steer = constrain(this.steer, -this.maxAngle, this.maxAngle)

    this.acceleration = createVector(ud_input, 0)
    this.velocity.add(this.acceleration)

    let R = this.sz.x / sin(this.steer)
    this.angularVelocity = this.velocity.x / R
    this.angle += this.angularVelocity
    this.angle = this.angle % (Math.PI * 2) //360 degrees
    this.velocity.x = constrain((this.velocity.x), -this.maxSpeed, this.maxSpeed)

    this.position.add(createVector(
      this.velocity.x * cos(this.angle),
      this.velocity.x * sin(this.angle)
    ))

    //fake drag
    this.velocity.x *= this.dragConstant
  }
  reset(start_angle)
  {
    this.position = createVector(this.start_pos.x, this.start_pos.y)
    this.angle = start_angle
  }
  intersects(checkpoint)
  {
    let check_pos = checkpoint['position']
    let check_size = checkpoint['sz']
    
    return(this.position.x + this.sz.x / 2 > check_pos.x - check_size.x / 2 &&
          this.position.x - this.sz.x / 2 < check_pos.x + check_size.x / 2 &&
          this.position.y + this.sz.y / 2 > check_pos.y - check_size.y / 2 &&
          this.position.y - this.sz.y / 2 < check_pos.y + check_size.y / 2)
  }
  get_current_state(checkpoint)
  {
    let current_state = 0
    for(let ray_index = 0; ray_index < this.numRays; ray_index++)
    {
      let check_pos = [createVector(
        checkpoint['position'].x - checkpoint['sz'].x / 2,
        checkpoint['position'].y - checkpoint['sz'].y / 2,
      ), createVector(
        checkpoint['position'].x + checkpoint['sz'].x / 2,
        checkpoint['position'].y + checkpoint['sz'].y / 2,
      )]
      let int_point = car.line_intersects_rect(check_pos, this.rays[ray_index])
      if(car.line_intersects_rect(check_pos, this.rays[ray_index]) != null)
      {
        current_state += pow(2, ray_index)
        stroke(255,0,0)
        line(this.rays[ray_index][0].x, this.rays[ray_index][0].y, this.rays[ray_index][1].x, this.rays[ray_index][1].y)
      }
    }
    return current_state
  }
  render(name="")
  {
    strokeWeight(1)
    this.rays = []

    const ray_angle_difference = (PI/1.05) / this.numRays
    let current_angle = -(ray_angle_difference * (float((this.numRays-1) / 2.0)))
    for(let i = 0; i < this.numRays; i++)
    {
      let first_point = createVector(
        this.position.x + cos(this.sz.x / 2),
        this.position.y + sin(this.sz.x / 2),
      )

      let second_point = createVector(
        first_point.x + cos(this.angle + current_angle)*this.rayLength,
        first_point.y + sin(this.angle + current_angle)*this.rayLength
      )

      current_angle += ray_angle_difference
      
      this.rays.push([first_point, second_point])
    }
    //rays

    // stroke('#1F2041')
    push()
    translate(this.position.x, this.position.y)
    noStroke()
    fill(this.bodyColor)
    textAlign(CENTER)
    text(name, 0, -this.sz.y)
    rotate(this.angle)

    // WHEELS
    fill('#1F2041')
    //front left wheel
    push()
    translate(this.sz.x/2 - this.wheelSize.x/2,-this.sz.y/2.5)// - this.wheelSize.y / 2.5)
    rotate(this.steer)  
    rect(0, 0, this.wheelSize.x, this.wheelSize.y, 2)
    pop()

    //front right wheel
    push()
    translate(this.sz.x/2 - this.wheelSize.x/2,this.sz.y/2.5)//+ this.wheelSize.y / 2.5)
    rotate(this.steer)  
    rect(0, 0, this.wheelSize.x, this.wheelSize.y, 2)
    pop()
    //

    //back left wheel
    push()
    translate(-this.sz.x/2 + this.wheelSize.x/2,-this.sz.y/2 - this.wheelSize.y / 2.5)
    rotate(this.steer / 1.3)
    rect(0, 0, this.wheelSize.x, this.wheelSize.y, 2)
    pop()
    //

    //back right wheel
    push()
    translate(-this.sz.x/2 + this.wheelSize.x/2,this.sz.y/2 + this.wheelSize.y / 2.5)
    rotate(this.steer / 1.3)  
    rect(0, 0, this.wheelSize.x, this.wheelSize.y, 2)
    pop()
    //

    //car body (on top of wheels)
    fill(0)
    rect(this.sz.x/2 - this.wheelSize.x/2, 0, this.wheelSize.y / 1.5, this.sz.y/1.5)

    fill(this.bodyColor)
    triangle(-this.sz.x/2,this.sz.y/2, this.sz.x/1.4, 0, -this.sz.x/2, -this.sz.y/2)
    
    pop()
  }
  line_intersects_rect(rectangle, ray)
  {
    if(rectangle == undefined || ray == undefined){return}
    const denom = ((rectangle[0].x - rectangle[1].x) * (ray[0].y - ray[1].y) - (rectangle[0].y - rectangle[1].y) * (ray[0].x - ray[1].x))

    let T = ((rectangle[0].x - ray[0].x) * (ray[0].y - ray[1].y) - (rectangle[0].y - ray[0].y) * (ray[0].x - ray[1].x)) / denom

    let U = -((rectangle[0].x - rectangle[1].x) * (rectangle[0].y - ray[0].y) - (rectangle[0].y - rectangle[1].y) * (rectangle[0].x - ray[0].x)) / denom

    let ret_value
    ret_value = T > 0 && T < 1 && U > 0 ? createVector(rectangle[0].x + T * (rectangle[1].x - rectangle[0].x),   rectangle[0].y + T * (rectangle[1].y - rectangle[0].y)) : null
    // if(ret_value != null){fill(255,0,0);noStroke;ellipse(ret_value.x, ret_value.y, 20, 20)}
    return ret_value
  }
}