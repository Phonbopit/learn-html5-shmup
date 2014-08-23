
BasicGame.MainMenu = function (game) {

  this.music = null;
  this.playButton = null;

};

BasicGame.MainMenu.prototype = {

  preload: function() {
    this.load.image('titlepage', 'assets/titlepage.png');
  },

  create: function () {

    //  We've already preloaded our assets, so let's kick right into the Main Menu itself.
    //  Here all we're doing is playing some music and adding a picture and button
    //  Naturally I expect you to do something significantly better :)

    var titlepage = this.add.sprite(0, 0, 'titlepage');
    titlepage.scale.setTo(0.35, 0.65);

    this.loadingText = this.add.text(160, 400, "Press Z or tap/click game to start", { font: "12px monospace", fill: "#fff" });
    this.loadingText.anchor.setTo(0.5, 0.5);
    this.add.text(160, 440, "image assets Copyright (c) 2002 Ari Feldman", { font: "8px monospace", fill: "#fff", align: "center"}).anchor.setTo(0.5, 0.5);
    this.add.text(160, 460, "sound assets Copyright (c) 2012 - 2013 Devin Watson", { font: "8px monospace", fill: "#fff", align: "center"}).anchor.setTo(0.5, 0.5);

  },

  update: function () {

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) || this.input.activePointer.isDown) {
      this.startGame();
    }
    //  Do some nice funky main menu effect here

  },

  startGame: function (pointer) {

    //  Ok, the Play Button has been clicked or touched, so let's stop the music (otherwise it'll carry on playing)
    // this.music.stop();

    //  And start the actual game
    this.state.start('Game');

  }

};
