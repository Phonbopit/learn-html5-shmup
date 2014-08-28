BasicGame.Game = function (game) {
};

BasicGame.Game.prototype = {

  preload: function() {
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('enemyBullet', 'assets/enemy-bullet.png');

    // Load PowerUp
    this.load.image('powerup1', 'assets/powerup1.png');

    // Load enemy image.
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);

    // Load white enemy
    this.load.spritesheet('whiteEnemy', 'assets/shooting-enemy.png', 32, 32);

    // Load Boss
    this.load.spritesheet('boss', 'assets/boss.png', 93, 75);

    // Load explosion
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);

    // Load Player
    this.load.spritesheet('player', 'assets/player.png', 64, 64);

  },

  create: function () {

    this.sea = this.add.tileSprite(0, 0, 320, 480, 'sea');

    this.setupPlayer();

    this.setupEnemies();

    this.setupBullets();

    this.setupExplosions();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.setupPlayerIcons();

    this.setupText();
  },

  update: function () {
    this.sea.tilePosition.y += 0.2;

    this.checkCollisions();

    // Random spawn
    this.spawnEnemies();
    this.enemyFire();

    this.detectPlayerInput();

    this.delayEffect();
  },

  fire: function() {
    // player.alive is a Sprite.alive see http://docs.phaser.io/Phaser.Sprite.html
    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;
    }

    this.nextShotAt = this.time.now + this.shotDelay;

    var bullet;

    if (this.weaponLevel === 0) {
      if (this.bulletPool.countDead() === 0) {
        return;
      }

      bullet = this.bulletPool.getFirstExists(false);
      bullet.reset(this.player.x, this.player.y - 16);
      bullet.body.velocity.y = -200;

    } else {
      if (this.bulletPool.countDead() < this.weaponLevel * 2) {
        return;
      }

      for (var i = 0; i < this.weaponLevel; i++) {
        bullet = this.bulletPool.getFirstExists(false);

        // spawn left bullet left off center
        bullet.reset(this.player.x - (10 + i * 5), this.player.y - 16);
        this.physics.arcade.velocityFromAngle(-95 - i * 10, 500, bullet.body.velocity);

        bullet = this.bulletPool.getFirstExists(false);
        bullet.reset(this.player.x + (10 + i * 5), this.player.y - 16);
        this.physics.arcade.velocityFromAngle(-85 + i * 10, 500, bullet.body.velocity);
      }
    }
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
    this.player.body.setSize(20, 20, 0, -5);
    this.weaponLevel = 0;
  },

  setupEnemies: function() {

    this.enemyBulletPool = this.add.group();
    this.enemyBulletPool.enableBody = true;
    this.enemyBulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBulletPool.createMultiple(100, 'enemyBullet');
    this.enemyBulletPool.scale.setTo(0.5, 0.5);
    this.enemyBulletPool.setAll('outOfBoundsKill', true);
    this.enemyBulletPool.setAll('checkWorldBounds', true);
    this.enemyBulletPool.setAll('reward', 0, false, false, 0, true);

    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);
    this.enemyPool.setAll('reward', 100, false, false, 0, true);

    // 10% chance after enemy dead.
    this.enemyPool.setAll('dropRate', 0.1, false, false, 0, true);
    
    this.bossPool = this.add.group();
    this.bossPool.enableBody = true;
    this.bossPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.bossPool.createMultiple(1, 'boss');
    this.bossPool.setAll('anchor.x', 0.5);
    this.bossPool.setAll('anchor.y', 0.5);
    this.bossPool.setAll('outOfBoundsKill', true);
    this.bossPool.setAll('checkWorldBounds', true);
    this.bossPool.setAll('reward', 10000, false, false, 0, true);
    this.bossPool.setAll('dropRate', 0, false, false, 0, true);

    // Set the animation for each sprite
    this.bossPool.forEach(function (enemy) {
      enemy.animations.add('fly', [ 0, 1, 2], 20, true);
      enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
      enemy.events.onAnimationComplete.add( function (e) {
        e.play('fly');
      }, this);
    });

    this.boss = this.bossPool.getTop();
    this.bossApproaching = false;
    this.bossInitialHealth = 500;

    // Set animation
    this.enemyPool.forEach(function(enemy) {
      enemy.animations.add('fly', [0, 1, 2], 20, true);
      enemy.animations.add('hit', [3, 1, 4, 2], 20, false);
      enemy.events.onAnimationComplete.add(function (e) {
        e.play('fly');
      }, this);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;
    this.enemyInitialhealth = 2;

    this.shooterPool = this.add.group();
    this.shooterPool.enableBody = true;
    this.shooterPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.shooterPool.createMultiple(20, 'whiteEnemy');
    this.shooterPool.setAll('anchor.x', 0.5);
    this.shooterPool.setAll('anchor.y', 0.5);
    this.shooterPool.setAll('outOfBoundsKill', true);
    this.shooterPool.setAll('checkWorldBounds', true);
    this.shooterPool.setAll('reward', 300, false, false, 0, true);

    // 20% chance after enemyShooter die.
    this.shooterPool.setAll('dropRate', 0.2, false, false, 0, true);
    // Set the animation for each sprite
    this.shooterPool.forEach(function (enemy) {
      enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
      enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
      enemy.events.onAnimationComplete.add( function (e) {
        e.play('fly');
      }, this);
    });

    // start spawning 5 seconds into the game
    this.nextShooterAt = this.time.now + 5000;
    this.shooterDelay = 3000;
    this.shooterShotDelay = 1000;
    this.shooterInitialHealth = 5;
  },

  setupBullets: function() {

    this.enemyBulletPool = this.add.group();

    this.enemyBulletPool.enableBody = true;
    this.enemyBulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBulletPool.createMultiple(50, 'enemyBullet');
    this.enemyBulletPool.setAll('anchor.x', 0.5);
    this.enemyBulletPool.setAll('anchor.y', 0.5);
    this.enemyBulletPool.setAll('outOfBoundsKill', true);
    this.enemyBulletPool.setAll('checkWorldBounds', true);
    this.enemyBulletPool.setAll('reward', 0, false, false, 0, true);

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

    this.powerUpPool = this.add.group();
    this.powerUpPool.enableBody = true;
    this.powerUpPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.powerUpPool.createMultiple(5, 'powerup1');
    this.powerUpPool.setAll('anchor.x', 0.5);
    this.powerUpPool.setAll('anchor.y', 0.5);
    this.powerUpPool.setAll('outOfBoundsKill', true);
    this.powerUpPool.setAll('checkWorldBounds', true);
    this.powerUpPool.setAll('reward', 100, false, false, 0, true);

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
      this.bulletPool,
      this.shooterPool,
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

    this.physics.arcade.overlap(
      this.player, 
      this.shooterPool,
      this.playerHit, 
      null,
      this
    );

    this.physics.arcade.overlap(
      this.player,
      this.enemyBulletPool,
      this.playerHit,
      null,
      this
    );

    this.physics.arcade.overlap(
      this.player,
      this.powerUpPool,
      this.playerPowerUp,
      null,
      this
    );

    if (this.bossApproaching === false) {
      this.physics.arcade.overlap(
        this.bulletPool, 
        this.bossPool, 
        this.enemyHit, 
        null, 
        this
      );

      this.physics.arcade.overlap(
        this.player, 
        this.bossPool, 
        this.playerHit, 
        null, 
        this
      );
    }
  },

  spawnEnemies: function() {
    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;

      this.enemyDelay = this.rnd.integerInRange(300, 1000);
      var enemy = this.enemyPool.getFirstExists(false);
      // width = 320, enemy width = 32, center is 32 /2 = 16
      enemy.reset(this.rnd.integerInRange(20, 304), 0, this.enemyInitialhealth);
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }

    if (this.nextShooterAt < this.time.now && this.shooterPool.countDead() > 0) {
      this.nextShooterAt = this.time.now + this.shooterDelay;

      this.shooterDelay = this.rnd.integerInRange(2000, 3000);
      this.shooterShotDelay = this.rnd.integerInRange(200, 1000);

      // Increase difficult if weapon level max.
      if (this.weaponLevel > 2) {
        this.shooterDelay = this.rnd.integerInRange(500, 1000);
        this.shooterShotDelay = this.rnd.integerInRange(200, 700);
      }

      var shooter = this.shooterPool.getFirstExists(false);

      // spawn at a random location at the top  
      shooter.reset(this.rnd.integerInRange(20, 448), 
        0, this.shooterInitialHealth);

      // choose a random target location at the bottom
      var target = this.rnd.integerInRange(20, 448);

      // move to target and rotate the sprite accordingly  
      shooter.rotation = this.physics.arcade.moveToXY(
        shooter, target, 320, this.rnd.integerInRange(30, 80)
      ) - Math.PI / 2;

      shooter.play('fly');

      shooter.nextShotAt = 0;
    }
  },

  enemyFire: function() {
    this.shooterPool.forEachAlive(function(enemy) {
      if (this.time.now > enemy.nextShotAt && this.enemyBulletPool.countDead() > 0) {
        var bullet = this.enemyBulletPool.getFirstExists(false);
        bullet.reset(enemy.x, enemy.y);
        this.physics.arcade.moveToObject(bullet, this.player, 150);
        enemy.nextShotAt = this.time.now + this.shooterShotDelay;
      }
    }, this);

    if (this.bossApproaching === false && this.boss.alive && 
        this.boss.nextShotAt < this.time.now &&
        this.enemyBulletPool.countDead() > 9) {

      this.boss.nextShotAt = this.time.now + 1000;

      for (var i = 0; i < 5; i++) {
        // process 2 bullets at a time
        var leftBullet = this.enemyBulletPool.getFirstExists(false);
        leftBullet.reset(this.boss.x - 10 - i * 10, this.boss.y + 20);
        var rightBullet = this.enemyBulletPool.getFirstExists(false);
        rightBullet.reset(this.boss.x + 10 + i * 10, this.boss.y + 20);

        if (this.boss.health > 250) {
          // aim directly at the player
          this.physics.arcade.moveToObject(leftBullet, this.player, 150);
          this.physics.arcade.moveToObject(rightBullet, this.player, 150);
        } else {
          // aim slightly off center of the player
          this.physics.arcade.moveToXY(
            leftBullet, this.player.x - i * 100, this.player.y, 150
          );
          this.physics.arcade.moveToXY(
            rightBullet, this.player.x + i * 100, this.player.y, 150
          );
        }
      }
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

    if (this.bossApproaching && this.boss.y > 80) {
      this.bossApproaching = false;
      this.boss.health = 500;
      this.boss.nextShotAt = 0;

      this.boss.body.velocity.y = 0;
      this.boss.body.velocity.x = 200;
      // allow bouncing off world bounds
      this.boss.body.bounce.x = 1;
      this.boss.body.collideWorldBounds = true;
    }
  },

  explode: function(sprite) {
    if (this.explosionPool.countDead() === 0) {
      return;
    }
    var explosion = this.explosionPool.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('boom', 15, false, true);
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
      this.weaponLevel = 0;
      this.ghostUntil = this.time.now + 2000;
      this.player.play('ghost');
    } else {
      this.explode(player);
      player.kill();
      this.displayEnd(false);
    }
  },

  playerPowerUp: function(player, powerUp) {
    this.addToScore(powerUp.reward);
    powerUp.kill();
    if (this.weaponLevel < 5) {
      this.weaponLevel += 1;
    }
  },

  damageEnemy: function(enemy, damage) {
    // detail : http://docs.phaser.io/Phaser.Sprite.html#damage
    enemy.damage(damage);
    if (enemy.alive) {
      enemy.play('hit');
    } else {
      this.explode(enemy);
      this.spawnPowerUp(enemy);
      this.addToScore(enemy.reward);

      if (enemy.key === 'boss') {
        this.enemyPool.destroy();
        this.shooterPool.destroy();
        this.bossPool.destroy();
        this.enemyBulletPool.destroy();
        this.displayEnd(true);
      }
    }
  },

  spawnPowerUp: function(enemy) {
    if (this.powerUpPool.countDead() === 0 || this.weaponLevel === 5) {
      return;
    }

    if (this.rnd.frac() < enemy.dropRate) {
       var powerUp = this.powerUpPool.getFirstExists(false);
       powerUp.reset(enemy.x, enemy.y);
       powerUp.body.velocity.y = 100;
     }
  },

  spawnBoss: function() {
    this.bossApproaching = true;
    var boss = this.bossPool.getFirstExists(false);
    this.physics.enable(boss, Phaser.Physics.ARCADE);
    boss.reset(160, 0, this.bossInitialHealth);
    boss.body.velocity.y = 15;
    boss.play('fly');

    this.enemyPool.destroy();
    // this.shooterPool.destroy();
  },

  addToScore: function(score) {
    this.score += score;
    this.scoreText.text = 'Score : ' + this.score;
    if (this.score >= 20000 && this.bossPool.countDead() == 1) {
/*      this.enemyPool.destroy();
      this.shooterPool.destroy();
      this.enemyBulletPool.destroy();

      this.displayEnd(true);*/
      this.spawnBoss();
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
