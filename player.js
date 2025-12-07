class Player {
    constructor(id, name, color, x, y) {
        this.id = id;
        this.name = name;
        this.color = color || "#" + Math.floor(Math.random() * 16777215).toString(16);
        this.x = x || Math.floor(Math.random() * 500);
        this.y = y || Math.floor(Math.random() * 500);
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            x: this.x,
            y: this.y
        };
    }
}

module.exports = Player;