const scale = 20;
const size = 600;

class Score {
  constructor(parent) {
    this.level = document.createElement("h2");
    this.level.innerText = "Level: ";
    parent.appendChild(this.level);

    this.nextLevel = document.createElement("h2");
    this.nextLevel.innerText = "Food left: ";
    parent.appendChild(this.nextLevel);
  }

  clear() {
    this.level.remove();
    this.nextLevel.remove();
  }

  update(state) {
    this.level.innerText = `Level: ${state.level}`;
    this.nextLevel.innerText = `Food left: ${state.nextLevel -
      state.snake.body.length}`;
  }
}

class CanvasDisplay {
  constructor(parent) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = size;
    this.canvas.height = size;
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
  }

  clearDisplay(status) {
    if (status === "lost") {
      this.ctx.fillStyle = "rgb(0, 0, 0)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = "rgb(80, 80, 80)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  clear() {
    this.canvas.remove();
  }

  drawSnake(snake) {
    for (let seg of snake.body) {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.fillRect(seg.x, seg.y, scale, scale);
    }
  }

  drawFood(foods) {
    for (let food of foods) {
      this.ctx.fillStyle = "#f4425f";
      this.ctx.fillRect(food.x, food.y, scale, scale);
    }
  }

  drawText() {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "40px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Game Over",
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "1rem Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Click To Restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );
  }

  update(state) {
    this.clearDisplay(state.status);
    this.drawFood(state.food);
    this.drawSnake(state.snake);

    if (state.status === "lost") this.drawText();
  }
}

class State {
  constructor(snake, food, speed) {
    this.snake = snake;
    this.food = [food];
    this.speed = speed;
    this.nextLevel = 5;
    this.level = 1;
    this.status = "playing";
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  setStatus(status) {
    this.status = status;
  }

  setNextLevel() {
    this.nextLevel += 5 + Math.floor(this.nextLevel / 2);
    if (this.level % 2 === 0) this.food.push(new Food());
    this.level++;
  }

  update(dir) {
    this.snake.update(this, dir);

    if (this.snake.body.length >= this.nextLevel) {
      this.setSpeed(this.speed * 0.8);
      this.setNextLevel();
    }
  }
}

class Segment {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  update(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Food extends Segment {
  constructor(x = 0, y = 0) {
    super(x, y);

    this.update();
  }

  update() {
    const cells = Math.floor(size / scale);
    this.x = Math.floor(Math.random() * cells) * scale;
    this.y = Math.floor(Math.random() * cells) * scale;
  }
}

class Head extends Segment {
  constructor(x, y, xSpeed, ySpeed) {
    super(x, y);
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
  }

  ranIntoEdge() {
    return (
      this.x < 0 || this.x + scale > size || this.y < 0 || this.y + scale > size
    );
  }

  ranIntoFood(foods) {
    for (let food of foods) {
      if (this.x === food.x && this.y === food.y) {
        food.update();
        return true;
      }
    }

    return false;
  }

  ranIntoSelf(body) {
    for (let i = 1; i < body.length; i++) {
      if (this.x === body[i].x && this.y === body[i].y) return true;
    }
    return false;
  }

  update(dir) {
    if (dir.has("ArrowUp")) {
      this.xSpeed = 0;
      this.ySpeed = -1;
    } else if (dir.has("ArrowRight")) {
      this.xSpeed = 1;
      this.ySpeed = 0;
    } else if (dir.has("ArrowDown")) {
      this.xSpeed = 0;
      this.ySpeed = 1;
    } else if (dir.has("ArrowLeft")) {
      this.xSpeed = -1;
      this.ySpeed = 0;
    }

    this.x = this.x + this.xSpeed * scale;
    this.y = this.y + this.ySpeed * scale;
  }
}

class Snake {
  constructor(x, y) {
    this.head = new Head(x, y);
    this.body = [this.head];
  }

  update(state, dir) {
    if (this.head.ranIntoEdge() || this.head.ranIntoSelf(this.body)) {
      state.setStatus("lost");
      return;
    }

    if (this.head.ranIntoFood(state.food)) {
      this.body.push(new Segment());
    }

    for (let i = this.body.length - 1; i > 0; i--) {
      const prev = this.body[i - 1];
      this.body[i].update(prev.x, prev.y);
    }

    this.head.update(dir);
  }
}

const runAnimation = (cb, int) => {
  const timerFunc = () => {
    const state = cb();
    if (state.status === "lost") {
      clearTimeout(timer);
      return;
    }

    setTimeout(timerFunc, state.speed);
  };

  const timer = setTimeout(timerFunc, int);
};

const runGame = () => {
  const trackKeys = keys => {
    let dir = new Set(["ArrowRight"]);

    const track = event => {
      if (keys.includes(event.key)) {
        dir.clear();
        dir.add(event.key);
      }
    };

    window.removeEventListener("keydown", track);
    window.addEventListener("keydown", track);
    return dir;
  };

  const arrowKeys = trackKeys([
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    "ArrowRight"
  ]);

  const display = new CanvasDisplay(document.getElementById("canvas"));
  const snake = new Snake(0, 0);
  const food = new Food();
  const state = new State(snake, food, 150);
  const score = new Score(document.getElementById("score"));

  const handleClick = () => {
    window.removeEventListener("click", handleClick);
    display.clear();
    score.clear();
    runGame();
  };

  runAnimation(() => {
    state.update(arrowKeys);
    display.update(state);
    score.update(state);

    if (state.status === "lost") {
      window.addEventListener("click", handleClick);
    }

    return state;
  }, state.speed);
};
