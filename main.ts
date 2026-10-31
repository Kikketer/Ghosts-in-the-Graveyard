namespace SpriteKind {
  export const Stone = SpriteKind.create();
  export const Hint = SpriteKind.create();
  export const Friend = SpriteKind.create();
  export const NPC = SpriteKind.create();
}
function changeScene() {
  if (currentScene == 0 && canTransitionScene) {
    currentScene = 1;
    music.stopAllSounds();
    intro1();
  } else if (currentScene == 1 && canTransitionScene) {
    currentScene = 2;
    music.stopAllSounds();
    playGame();
  } else if (currentScene == 3 && canTransitionScene) {
    music.stopAllSounds();
    game.reset();
  }
}
function createFlipped(anim: Image[]) {
  tempList = [];
  for (let Frame = 0; Frame <= anim.length - 1; Frame++) {
    tempImage = anim[Frame];
    tempImage.flipX();
    tempList.push(tempImage);
  }
  return tempList;
}
function setupAnim() {
  characterAnimations.loopFrames(
    heroSprite,
    assets.animation`playerIdle`,
    200,
    characterAnimations.rule(Predicate.NotMoving, Predicate.FacingRight),
  );
  characterAnimations.loopFrames(
    heroSprite,
    boyIdleFlipped,
    200,
    characterAnimations.rule(Predicate.NotMoving, Predicate.FacingLeft),
  );
  characterAnimations.loopFrames(
    heroSprite,
    assets.animation`playerWalk`,
    100,
    characterAnimations.rule(Predicate.Moving, Predicate.FacingRight),
  );
  characterAnimations.loopFrames(
    heroSprite,
    boyWalkFlipped,
    100,
    characterAnimations.rule(Predicate.Moving, Predicate.FacingLeft),
  );
}
function endGame(success: boolean) {
  game.gameOver(success);
}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
  if (currentScene == 2) {
    checkStone();
  } else {
    changeScene();
  }
});
function checkShouldRun() {
  for (
    let potentialCloseStoneIndex = 0;
    potentialCloseStoneIndex <= tiles.getTilesByType(assets.tile`StoneTileOne`).length - 1;
    potentialCloseStoneIndex++
  ) {
    // If a stone is close and we are above it, flee the friend.
    if (
      tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialCloseStoneIndex].x < heroSprite.x + 60 &&
      tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialCloseStoneIndex].x > heroSprite.x - 40 &&
      heroSprite.z < tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialCloseStoneIndex].y &&
      stonesData[potentialCloseStoneIndex] != "none" &&
      stonesData[potentialCloseStoneIndex] != "BOO"
    ) {
      console.log("RUN AWAY! " + stonesData[potentialCloseStoneIndex]);
      foundTenantIndex = tenantNames.indexOf(stonesData[potentialCloseStoneIndex]);
      tempFriendSprite = sprites.create(tenantImages[foundTenantIndex], SpriteKind.Friend);
      tempFriendSprite.setPosition(
        tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialCloseStoneIndex].x,
        tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialCloseStoneIndex].y,
      );
      tempFriendSprite.sayText("Ahh!");
      if (tempFriendSprite.x < heroSprite.x) {
        tempFriendSprite.setVelocity(-200, 0);
      } else {
        tempFriendSprite.setVelocity(200, 0);
      }
      tempFriendSprite.setFlag(SpriteFlag.AutoDestroy, true);
      availableTenants.push(stonesData[potentialCloseStoneIndex]);
      stonesData[potentialCloseStoneIndex] = "none";
      assignTenants(potentialCloseStoneIndex);
    }
  }
}
function intro1() {
  canTransitionScene = false;
  scene.setBackgroundImage(img`
        . 
        `);
  tutorialText = fancyText.create("What started as a simple game of hide and seek...");
  fancyText.setMaxWidth(tutorialText, 140);
  fancyText.setFont(tutorialText, fancyText.art_deco_11);
  fancyText.setColor(tutorialText, 4);
  tutorialText.setPosition(80, 60);
  fancyText.setAnimationSound(
    tutorialText,
    music.createSoundEffect(
      WaveShape.Square,
      96,
      97,
      255,
      0,
      100,
      SoundExpressionEffect.None,
      InterpolationCurve.Linear,
    ),
  );
  fancyText.animateAtSpeed(tutorialText, fancyText.TextSpeed.Fast, fancyText.AnimationPlayMode.UntilDone);
  setTimeout(() => {
    sprites.destroy(tutorialText);
    canTransitionScene = true;
    changeScene();
  }, 1000);
}
function moveHero() {
  if (canMove == false) {
    heroSprite.setVelocity(0, 0);
    return;
  }
  if (controller.right.isPressed()) {
    potentialMoveHorizontal = walkingSpeed;
  } else if (controller.left.isPressed()) {
    potentialMoveHorizontal = walkingSpeed * -1;
  } else {
    potentialMoveHorizontal = 0;
  }
  if (controller.up.isPressed()) {
    potentialMoveVertical = walkingSpeed * -1;
  } else if (controller.down.isPressed()) {
    potentialMoveVertical = walkingSpeed;
  } else {
    potentialMoveVertical = 0;
  }
  heroSprite.z = heroSprite.y;
  checkStoneBlocks();
}
function assignTenants(excludeIndex: number) {
  console.log("Available tenants " + availableTenants.length);
  while (availableTenants.length > 0) {
    tempProposedLocation = randint(0, stonesData.length);
    if (stonesData[tempProposedLocation] == "none" && excludeIndex != tempProposedLocation) {
      stonesData[tempProposedLocation] = availableTenants.removeAt(0);
      console.log("At stone: " + tempProposedLocation + " " + stonesData[tempProposedLocation]);
    }
  }
}
function checkLoop() {
  if (heroSprite.x > 1760) {
    heroSprite.setPosition(160, heroSprite.y);
  } else if (heroSprite.x < 160) {
    heroSprite.setPosition(1760, heroSprite.y);
  }
}
function checkStoneBlocks() {
  for (let overlapPotential of sprites.allOfKind(SpriteKind.Stone)) {
    // If overlapping fine, but check z-index to make sure they can't be at the bottom of the stone
    if (heroSprite.overlapsWith(overlapPotential)) {
      if (heroSprite.y > overlapPotential.y - 5 && heroSprite.y < overlapPotential.y + 5) {
        // Aligned vertically, but attempting to move right/left/up/down
        if (potentialMoveHorizontal < 0 && heroSprite.x > overlapPotential.x) {
          potentialMoveHorizontal = 0;
        } else if (potentialMoveHorizontal > 0 && heroSprite.x < overlapPotential.x) {
          potentialMoveHorizontal = 0;
        }
      } else if (
        heroSprite.y > overlapPotential.y - 10 &&
        heroSprite.y < overlapPotential.y + 5 &&
        potentialMoveVertical > 0
      ) {
        potentialMoveVertical = 0;
      } else if (
        heroSprite.y < overlapPotential.y + 10 &&
        heroSprite.y > overlapPotential.y - 5 &&
        potentialMoveVertical < 0
      ) {
        potentialMoveVertical = 0;
      }
    }
  }
  heroSprite.setVelocity(potentialMoveHorizontal, potentialMoveVertical);
}
function checkStone() {
  tempFoundStoneIndex = -1;
  tempFoundBoo = false;
  for (
    let potentialOverlapStoneIndex = 0;
    potentialOverlapStoneIndex <= tiles.getTilesByType(assets.tile`StoneTileOne`).length - 1;
    potentialOverlapStoneIndex++
  ) {
    if (
      heroSprite.tilemapLocation().getNeighboringLocation(CollisionDirection.Top).column ==
        tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialOverlapStoneIndex].column &&
      heroSprite.tilemapLocation().getNeighboringLocation(CollisionDirection.Top).row ==
        tiles.getTilesByType(assets.tile`StoneTileOne`)[potentialOverlapStoneIndex].row
    ) {
      music.stopAllSounds();
      canMove = false;
      tempFoundStoneIndex = potentialOverlapStoneIndex;
      if (stonesData[potentialOverlapStoneIndex] == "BOO") {
        tempFoundBoo = true;
        break;
      } else if (stonesData[potentialOverlapStoneIndex] != "none") {
        tempFoundBoo = false;
        break;
      }
    }
  }
  if (tempFoundStoneIndex >= 0) {
    foundFriendIndex = tenantNames.indexOf(stonesData[tempFoundStoneIndex]);
    stonesData[tempFoundStoneIndex] = "none";
    timer.after(1000, function () {
      canMove = true;
      console.log("The temp found index " + tempFoundStoneIndex);
      if (tempFoundBoo) {
        jumpScare();
      } else if (foundFriendIndex >= 0 && !tempFoundBoo) {
        updateFriendsCount();
        music.play(music.createSong(assets.song`overworld`), music.PlaybackMode.LoopingInBackground);
        tempFriendSprite = sprites.create(tenantImages[foundFriendIndex], SpriteKind.Friend);
        tempFriendSprite.setPosition(
          heroSprite.tilemapLocation().getNeighboringLocation(CollisionDirection.Top).column * 16,
          heroSprite.tilemapLocation().getNeighboringLocation(CollisionDirection.Top).row * 16,
        );
        heroSprite.sayText("Found you " + tenantNames[foundFriendIndex], 1000, true);
        tempFriendSprite.setFlag(SpriteFlag.AutoDestroy, true);
        animation.runImageAnimation(tempFriendSprite, friendIdleAnimations[foundFriendIndex], 200, true);
        timer.after(1000, function () {
          tempFriendSprite.setVelocity(-150, 0);
          animation.runImageAnimation(tempFriendSprite, friendRunningAnimations[foundFriendIndex], 100, true);
        });
        foundFriends.push(sprites.create(tenantImages[foundFriendIndex], 0));
        if (foundFriends.length == tenantNames.length - 1) {
          endGame(true);
        }
      } else if (tempFoundStoneIndex >= 0) {
        heroSprite.sayText("No one here...", 1000, true);
      }
    });
  }
}
function showHints() {
  for (let stoneIndex = 0; stoneIndex <= tiles.getTilesByType(assets.tile`StoneTileOne`).length - 1 - 1; stoneIndex++) {
    if (stonesData[stoneIndex] == "BOO") {
      tempSprite = sprites.create(assets.image`hintOne`, SpriteKind.Hint);
      tempSprite.setPosition(
        (tiles.getTilesByType(assets.tile`StoneTileOne`)[stoneIndex].column + 1) * 16 - 4,
        tiles.getTilesByType(assets.tile`StoneTileOne`)[stoneIndex].row * 16 + 4,
      );
    } else if (stonesData[stoneIndex] != "none") {
      tempSprite = sprites.create(assets.image`hintKid`, SpriteKind.Hint);
      tempSprite.setPosition(
        (tiles.getTilesByType(assets.tile`StoneTileOne`)[stoneIndex].column + 1) * 16 - 4,
        tiles.getTilesByType(assets.tile`StoneTileOne`)[stoneIndex].row * 16 + 4,
      );
    }
  }
  setTimeout(() => {
    sprites.destroyAllSpritesOfKind(SpriteKind.Hint);
    nextHintTime = control.millis() + randint(2000, 4000);
  }, 400);
}
function updateFriendsCount() {
  sprites.destroy(friendCount);
  friendCount = fancyText.create(
    "Friends " + (tenantNames.length - 1 - foundFriends.length),
    80,
    1,
    fancyText.geometric_sans_6,
  );
  friendCount.setPosition(scene.cameraProperty(CameraProperty.X) - 40, scene.cameraProperty(CameraProperty.Y) - 48);
  friendCount.setFlag(SpriteFlag.Ghost, true);
  friendCount.z = 100;
}
function playGame() {
  canMove = true;
  canTransitionScene = false;
  nextHintTime = control.millis() + randint(1000, 2000);
  updateFriendsCount();
  tutorialGirl = sprites.create(assets.image`TutorialGirl`, SpriteKind.NPC);
  tutorialGirl.setPosition(280, 185);
  animation.runImageAnimation(tutorialGirl, assets.animation`girlIdle`, 200, true);
  tutorialGirl.sayText("Sneak up from the front of the stones", 3000, true);
  music.play(music.createSong(assets.song`overworld`), music.PlaybackMode.LoopingInBackground);
  setTimeout(() => {
    tutorialGirl.sayText("Watch out for the ghost!", 3000, true);
  }, 3000);
  scene.setBackgroundImage(assets.image`Background`);
  tiles.setCurrentTilemap(tilemap`levelOne`);
  walkingSpeed = 70;
  stoneSprites = [assets.image`GraveStone`, assets.image`GraveStone2b`];
  availableTenants = tenantNames.slice();
  stonesData = [];
  for (let stoneLoc of tiles.getTilesByType(assets.tile`StoneTileOne`)) {
    tempSprite = sprites.create(stoneSprites._pickRandom(), SpriteKind.Stone);
    tiles.placeOnTile(tempSprite, stoneLoc);
    tempSprite.z = tempSprite.y;
    stonesData.push("none");
  }
  assignTenants(-1);
  heroSprite = sprites.create(assets.image`ChildB`, SpriteKind.Player);
  heroSprite.setFlag(SpriteFlag.ShowPhysics, false);
  heroSprite.setPosition(256, 192);
  scene.cameraFollowSprite(heroSprite);
  setupAnim();
}
function jumpScare() {
  canTransitionScene = false;
  currentScene = 3;
  tiles.setCurrentTilemap(tilemap`end`);
  sprites.destroy(heroSprite);
  for (let friend of foundFriends) {
    sprites.destroy(friend);
  }
  foundFriends = [];
  sprites.destroy(tempSprite);
  sprites.destroyAllSpritesOfKind(SpriteKind.Stone);
  sprites.destroyAllSpritesOfKind(SpriteKind.Friend);
  sprites.destroy(friendCount);
  tempSprite = sprites.create(assets.image`JumpScare`, 0);
  music.play(music.createSong(assets.song`Jumped`), music.PlaybackMode.InBackground);
  scene.centerCameraAt(80, 60);
  tempSprite.setPosition(80, 60);
  tempSprite.setScale(jumpScale, ScaleAnchor.Middle);
  setTimeout(() => {
    tempSprite = fancyText.create("Game over", 120, 1, fancyText.art_deco_11);
    tempSprite.setPosition(90, 60);
    tempSprite = fancyText.create("The ghost got you!", 160, 1, fancyText.art_deco_11);
    tempSprite.setPosition(85, 90);
  }, 500);
  setTimeout(() => {
    canTransitionScene = true;
  }, 3000);
}
let stoneSprites: Image[] = [];
let friendCount: fancyText.TextSprite = null;
let foundFriends: Sprite[] = [];
let foundFriendIndex = 0;
let tempFoundBoo = false;
let tempFoundStoneIndex = 0;
let tempProposedLocation = 0;
let potentialMoveVertical = 0;
let walkingSpeed = 0;
let potentialMoveHorizontal = 0;
let tutorialText: fancyText.TextSprite = null;
let tempFriendSprite: Sprite = null;
let foundTenantIndex = 0;
let stonesData: string[] = [];
let heroSprite: Sprite = null;
let tempList: Image[] = [];
let boyWalkFlipped: Image[] = [];
let boyIdleFlipped: Image[] = [];
let currentScene = 0;
let friendRunningAnimations: Image[][] = [];
let friendIdleAnimations: Image[][] = [];
let tenantImages: Image[] = [];
let tempImage: Image = null;
let jumpScale = 0;
let canMove = false;
let tempSprite: Sprite = null;
let tutorialGirl: Sprite = null;
let tenantNames: string[] = [];
let availableTenants: string[] = [];
let canTransitionScene = false;
let nextHintTime = control.millis() + 2000;
canMove = true;
jumpScale = 0;
tempImage = img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    `;
availableTenants = [];
tenantNames = [];
tenantNames = ["BOO", "Fred", "Mike", "Jay", "Penny", "Chuck"];
tenantImages = [
  img`
    . 
    `,
  assets.image`ChildA`,
  assets.image`ChildA`,
  assets.image`ChildA`,
  assets.image`ChildA`,
  assets.image`ChildA`,
];
friendIdleAnimations = [
  assets.animation`girlIdle`,
  assets.animation`playerIdle`,
  assets.animation`playerIdle`,
  assets.animation`girlIdle`,
  assets.animation`girlIdle`,
  assets.animation`playerIdle`,
];
friendRunningAnimations = [
  createFlipped(assets.animation`girlWalk`),
  createFlipped(assets.animation`playerWalk`),
  createFlipped(assets.animation`playerWalk`),
  createFlipped(assets.animation`girlWalk`),
  createFlipped(assets.animation`girlWalk`),
  createFlipped(assets.animation`playerWalk`),
];
let tenantAnimations = [
  [
    img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    `,
  ],
];
scene.setBackgroundColor(15);
scene.setBackgroundImage(assets.image`TitleScreen`);
currentScene = 0;
boyIdleFlipped = createFlipped(assets.animation`playerIdle`);
boyWalkFlipped = createFlipped(assets.animation`playerWalk`);
let girlIdleFlipped = createFlipped(assets.animation`girlIdle`);
let girlWalkFlipped = createFlipped(assets.animation`girlWalk`);
timer.background(function () {
  music.play(music.createSong(assets.song`titleIntro`), music.PlaybackMode.UntilDone);
  if (currentScene == 0) {
    music.play(music.createSong(assets.song`titleLoop`), music.PlaybackMode.LoopingInBackground);
  }
});
timer.after(2000, function () {
  canTransitionScene = true;
});
game.onUpdate(function () {
  if (currentScene == 2 && heroSprite) {
    moveHero();
    friendCount.setPosition(scene.cameraProperty(CameraProperty.X) - 40, scene.cameraProperty(CameraProperty.Y) - 54);
    if (control.millis() > nextHintTime) {
      showHints();
    }
  } else if (currentScene == 3 && tempSprite) {
    if (jumpScale < 2.4) {
      jumpScale += 0.3;
      tempSprite.setScale(jumpScale, ScaleAnchor.Middle);
    }
  }
});
game.onUpdateInterval(250, function () {
  if (currentScene == 2 && heroSprite) {
    checkShouldRun();
    checkLoop();
  }
});
