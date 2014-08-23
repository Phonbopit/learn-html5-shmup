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

    this.sea = this.add.tileSprite(0, 0, 1024, 768, 'sea');

    // setup player
    this.player = this.add.sprite(400, 650, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [0, 1, 2], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;
    this.player.body.collideWorldBounds = true;

    // after load enemy, now i can use it.
/*    this.enemy = this.add.sprite(512, 300, 'greenEnemy');
    this.enemy.animations.add('fly', [0, 1, 2], 20, true);
    this.enemy.play('fly');
    // Set default anchor to center the sprites.
    this.enemy.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.enemy, Phaser.Physics.ARCADE);*/
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);

    // Set animation
    this.enemyPool.forEach(function(enemy) {
      enemy.animations.add('fly', [0, 1, 2], 20, true);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;


    // this.bullets = [];

    // User Phaser.Group

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
    this.shotDelay = 200;

    this.cursors = this.input.keyboard.createCursorKeys();

    this.instructions = this.add.text(510, 600,
      'Use Arrow Keys to Move, Press Z to Fire\n' + 
      'Tapping/clicking does both', {
        font: '20px monospace', fill: '#fff', align: 'center'
      });
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 10000;
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

    // Random spawn
    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      enemy.reset(this.rnd.integerInRange(20, 1004), 0);
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }

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
      this.fire();
    }

    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }

  },

  render: function() {
/*    this.game.debug.body(this.bullet);
    this.game.debug.body(this.enemy);*/
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

  enemyHit: function(bullet, enemy) {
    bullet.kill();
    enemy.kill();
    var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
  },

  playerHit: function(player, enemy) {
    enemy.kill();

    var explosion = this.add.sprite(player.x, player.y, 'explosion');
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);

    player.kill();
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
