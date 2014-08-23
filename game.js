BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {

  preload: function() {
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');

    // Load enemy image.
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);

    // Load explosion
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);

    // Load Player
    this.load.spritesheet('player', 'assets/player.png', 64, 64);

  },

  create: function () {

    this.sea = this.add.tileSprite(0, 0, 320, 480, 'sea');

    this.setupPlayer();

    // after load enemy, now i can use it.
/*    this.enemy = this.add.sprite(512, 300, 'greenEnemy');
    this.enemy.animations.add('fly', [0, 1, 2], 20, true);
    this.enemy.play('fly');
    // Set default anchor to center the sprites.
    this.enemy.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.enemy, Phaser.Physics.ARCADE);*/

    this.setupEnemies();

    // this.bullets = [];

    // User Phaser.Group

    this.setupBullets();

    this.setupExplosions();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.setupPlayerIcons();

    this.setupText();
  },

  update: function () {
    this.sea.tilePosition.y += 0.2;

/*    for (var i = 0; i < this.bullets.length; i++) {
      this.physics.arcade.overlap(
        this.bullets[i],
        this.enemy,
        this.enemyHit,
        null,
        this
      );
    }*/

    this.checkCollisions();

    // Random spawn
    this.spawnEnemies();

    this.detectPlayerInput();

    this.delayEffect();
  },

  render: function() {
/*    this.game.debug.body(this.bullet);
    this.game.debug.body(this.enemy);*/
    // this.game.debug.body(this.player);
  },

  fire: function() {
    // player.alive is a Sprite.alive see http://docs.phaser.io/Phaser.Sprite.html
    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;
    }

    if (this.bulletPool.countDead() === 0) {
      return;
    }

    this.nextShotAt = this.time.now + this.shotDelay;

/*    var bullet  = this.add.sprite(this.player.x, this.player.y - 16, 'bullet');
    bullet.anchor.setTo(0.5, 0.5);

    //Apply Phisics
    this.physics.enable(bullet, Phaser.Physics.ARCADE);
    bullet.body.velocity.y = -200;

    // Add bullet to bullets list
    this.bullets.push(bullet);*/

    // Find first dead bullet in the pool
    var bullet = this.bulletPool.getFirstExists(false);

    bullet.reset(this.player.x, this.player.y - 16);
    bullet.body.velocity.y = -200;
  },

  setupPlayer: function() {
    this.player = this.add.sprite(160, 480, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [0, 1, 2], 10, true);
    this.player.animations.add('ghost', [3, 0, 3, 1], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;
    this.player.body.collideWorldBounds = true;
  },

  setupEnemies: function() {
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);
    this.enemyPool.setAll('reward', 100, false, false, 0, true);

    // Set animation
    this.enemyPool.forEach(function(enemy) {
      enemy.animations.add('fly', [0, 1, 2], 20, true);
      enemy.animations.add('hit', [3, 1, 4, 2], 20, false);
      enemy.events.onAnimationComplete.add(function(e) {
        e.play('fly');
      }, this);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;
    this.enemyInitialhealth = 2;
  },

  setupBullets: function() {
    // Add an empty sprite group into our game.
    this.bulletPool = this.add.group();

    // Enable physics to sprite group
    this.bulletPool.enableBody = true;
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

    this.bulletPool.createMultiple(100, 'bullet');

    this.bulletPool.setAll('anchor.x', 0.5);
    this.bulletPool.setAll('anchor.y', 0.5);
    // this.bulletPool.setTo(0.5, 0.5);

    // Kill a bullet when out of bound (over screen)
    this.bulletPool.setAll('outOfBoundsKill', true);
    this.bulletPool.setAll('checkWorldBounds', true);

    this.nextShotAt = 0;
    this.shotDelay = 100;
  },

  setupExplosions: function() {
    this.explosionPool = this.add.group();
    this.explosionPool.enableBody = true;
    this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosionPool.createMultiple(100, 'explosion');
    this.explosionPool.setAll('anchor.x', 0.5);
    this.explosionPool.setAll('anchor.y', 0.5);
    // Set explosion Animation
    this.explosionPool.forEach(function (explosion) {
      explosion.animations.add('boom');
    });
  },

  setupPlayerIcons: function() {
    this.lives = this.add.group();
    for (var i = 0; i < 3; i++) {
      var life = this.lives.create(240 + (30 * i), 30, 'player');
      life.scale.setTo(0.4, 0.4);
      life.anchor.setTo(0.5, 0.5);
    }
  },

  setupText: function() {
    this.instructions = this.add.text(160, 400,
      'Use Arrow Keys to Move, Press Z to Fire\n' + 
      'Tapping/clicking does both', {
        font: '14px monospace', fill: '#fff', align: 'center'
      });
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 5000;

    this.score = 0;
    this.scoreText = this.add.text(
      160, 30, 'Score : ' + this.score, {
        font: '20px monospace', 
        fill: '#ffffff',
        align: 'center'
      });
    this.scoreText.anchor.setTo(0.5, 0.5);
  },

  checkCollisions: function() {
    this.physics.arcade.overlap(
      this.bulletPool,
      this.enemyPool,
      this.enemyHit,
      null,
      this
    );

    this.physics.arcade.overlap(
      this.player,
      this.enemyPool,
      this.playerHit,
      null,
      this
    );
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      // width = 320, enemy width = 32, center is 32 /2 = 16
      enemy.reset(this.rnd.integerInRange(20, 304), 0, this.enemyInitialhealth);
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }
  },

  detectPlayerInput: function() {
        this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    // Handling all keyboard input (keyDown)
    // Left & Right 
    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }

    // Up & Down 
    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    // Handler Mouse Click & Touch
    if (this.input.activePointer.isDown &&
        this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
        this.input.activePointer.isDown) {
      // this.fire();
      if (this.returnText && this.returnText.exists) {
        this.quitGame();
      } else {
        this.fire();
      }
    }
  },

  delayEffect: function() {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }

    if (this.ghostUntil && this.ghostUntil < this.time.now) {
      this.ghostUntil = null;
      this.player.play('fly');
    }

    if (this.showReturn && this.time.now > this.showReturn) {
      this.returnText = this.add.text(160, 320, 
        'Press Z or Tap Game to go back to Main Menu', {
          font: '16px serif',
          fill: '#fff'
        }
      );

      this.returnText.anchor.setTo(0.5, 0.5);
      this.showReturn = false;
    }
  },

  explode: function(sprite) {
    if (this.explosionPool.countDead() === 0) {
      return;
    }
    var explosion = this.explosionPool.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('boom', 15, false, true);

    // Add original sprite's velocity
/*    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;*/
  },

  enemyHit: function(bullet, enemy) {
    bullet.kill();
    this.damageEnemy(enemy, 1);
  },

  playerHit: function(player, enemy) {

    if (this.ghostUntil && this.ghostUntil > this.time.now) {
      return;
    }

    this.damageEnemy(enemy, 5);
    var life = this.lives.getFirstAlive();
    if (life) {
      life.kill();
      this.ghostUntil = this.time.now + 2000;
      this.player.play('ghost');
    } else {
      this.explode(player);
      player.kill();
      this.displayEnd(false);
    }
  },

  damageEnemy: function(enemy, damage) {
    // detail : http://docs.phaser.io/Phaser.Sprite.html#damage
    enemy.damage(damage);
    if (enemy.alive) {
      enemy.play('hit');
    } else {
      this.explode(enemy);
      this.addToScore(enemy.reward);
    }
  },

  addToScore: function(score) {
    this.score += score;
    this.scoreText.text = 'Score : ' + this.score;
    if (this.score >= 10000) {
      this.enemyPool.destroy();
      this.playerEnd(true);
    }
  },

  displayEnd: function(win) {
    if (this.endText && this.endText.exists) {
      return;
    }

    var message = win ? 'Yoo Win!!!' : 'Game Over!';
    this.endText = this.add.text(160, 240, message, {
      font: '48px serif', 
      fill: '#f00'
    });
    this.endText.anchor.setTo(0.5, 0);
    this.showReturn = this.time.now + 2000;
  },

  quitGame: function(pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.
    this.sea.destroy();
    this.player.destroy();
    this.enemyPool.destroy();
    this.bulletPool.destroy();
    this.explosionPool.destroy();
    this.instructions.destroy();
    this.scoreText.destroy();
    this.returnText.destroy();

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
