/*

NOTE 1: blinking objects (neon effect)
NOTE 2: it IS possible to get through, it's just adjucted so that it would not be that simple

Extensions: sound and platforms. 

Sound.
Background: plays in a loop after key press to change the initial game screen; stops if game over or level complete.
Jumping: plays once when gameChar_y decreases.
Falling : plays once when conditions of plummeting are met. 
Walking: plays when a related key is pressed; stops whenever walking is false. 
Flagpole reach and level complete: play once with those events, all other sounds are stopped.
Difficult: to find the correct place for sound in the code. It helped to better understand the overall stages of the code execution, including loops and transitions. 

Platforms. 
Generally made with the factory pattern, sometimes make it difficult to get the coin, sometimes - easier. Essential to get over the wall. The wall itself is also a platform. 
Difficult: my character's falling down and jumping  forward appearances are the same, and she's not allowed to jump if not on the ground (now also on platform). Had to get through the code and understand all the conditions of her movement.  

Also made a wall object (although not a very elegant decision) to practice the methods. Faced the problem with the speed of code performance. I wanted to create all the items related to the wall (including platforms to get over it and upper collectables) by the methods in the wall object (e.g. collectablesGetOver: function(){collectables.push({///collectable objects///});). But in several frames, the code runs so slow it's impossible to get through the game. Overcoming these problems made me think a lot about how the code works, and how to make it more efficient. Found out that complex decisions are not always the best. 

*/
var screen = 0;

var gameChar_x;
var gameChar_y;
var floorPos_y;
var scrollPos;
var gameChar_world_x;

var isLeft;
var isRight;
var isFalling;
var isPlummeting;

var clouds;
var mountains;
var trees_x;
var trees_y;
var wall;

var canyons;
var collectables;

var platforms;

var game_score;
var flagpole;
var lives;

var myFont;
var jumpSound;
var fallDownSound;
var walkingSound; 
var itemFoundSound;
var flagSound;
var levelCompleteSound;
var backgroundSound;

function preload() 
{
	soundFormats ('mp3', 'wav');
	
	jumpSound = loadSound('sounds/Jump.mp3');
	jumpSound.setVolume(0.2);
	
	fallDownSound = loadSound('sounds/FallDown.mp3');
	fallDownSound.setVolume(0.2);
	
	walkingSound = loadSound('sounds/Walking.mp3');
	walkingSound.setVolume(0.05);
	
	itemFoundSound = loadSound('sounds/ItemFound.wav');
	itemFoundSound.setVolume (0.1);
	
	flagSound = loadSound('sounds/Flag.wav');
	flagSound.setVolume(0.2);
	
	levelCompleteSound = loadSound('sounds/LevelComplete.wav');
	levelCompleteSound.setVolume(0.2);
	
	backgroundSound = loadSound('sounds/BackgroundLoop.mp3');
	backgroundSound.setVolume(0.1);
	
	myFont = 
	[
		loadFont('fonts/Vulturemotordemo-95ln.otf'),
		loadFont('fonts/Znikomitno24-GBPP.otf'),
	];
}

function setup()
{
	createCanvas(1024, 576);
	
	floorPos_y = height * 3/4;
	
	lives = 3;
	
	if(lives > 0)
	{
		startGame();
	}
}


function draw()
{
	if (screen == 0)
	{
		push();
		background(0);
		stroke(50);
		fill(255);
		textSize(55);
		textFont(myFont[1]);
		textAlign(CENTER, CENTER);
		text("S T A R T  T H E  G A M E", width/2, height/2);
		textSize(48);
		text("Press space to start", width/2, height/2 + 100);
		pop();
	}
	
	if (screen == 1)
	{
		background(25,25,112);//fill the sky MidnightBlue

		noStroke();
		fill(0, 100, 0);
		rect(0, floorPos_y, width, height/4); // draw some green ground

		push();
		translate(scrollPos,0);

		drawClouds();
		drawMountains();
		drawTrees();
		wall.drawWall();
		wall.checkWallSide();

		//Draw platforms
		for (i = 0; i < platforms.length; i++)
		{
			platforms[i].draw();	
		}

		// Draw canyons
		for (i = 0; i < canyons.length; i++)
		{
			drawCanyon(canyons[i]);
			checkCanyon(canyons[i]);

			if (isPlummeting == true)
			{
				gameChar_y += 1;
			}
		}

		// Draw collectable items
		for (i = 0; i < collectables.length; i++)
		{
			if(collectables[i].isFound == false)
			{
				drawCollectable(collectables[i]);
				checkCollectable(collectables[i]);
			}
		}

		renderFlagpole(); // Draw the flagpole 
		drawSignpost(-2518); // Draw the Nowhere sign

		pop();

		drawGameChar(); // Draw game character

		// Draw the score counter
		push();
		fill(255,255,0);
		stroke(255,255,0);
		textSize(23);
		textFont(myFont[1]);
		text("s c o r e :   " + game_score, 20, 22);
		pop();

		// Draw life tokens
		lifeTokens();


		//-----------------------------------------------------
		// GAME OVER and LEVEL COMPLETE conditional statements 
		//-----------------------------------------------------

		// Game over conditional statement 

		if(lives < 1)
		{
			gameOverPoster();
			return;
		}

		// Level complete conditional statement 

		if(flagpole.isReached == true)
		{
			levelCompletePoster();
			walkingSound.stop();
			if(gameChar_y = floorPos_y)
			{
				return;
			}
		}

		//--------------------------------
		// Logic to make the game character move or the background scroll
		//--------------------------------

		if(isLeft)
		{
			if(gameChar_x > width * 0.2)
			{
				gameChar_x -= 5;
				walkingSound.play();
			}

			else
			{
				scrollPos += 5;
				walkingSound.play();
			}
		}

		if(isRight)
		{
			if(gameChar_x < width * 0.8)
			{
				gameChar_x  += 5;
				walkingSound.play();
			}

			else
			{
				scrollPos -= 5; // negative for moving against the background
				walkingSound.play();
			}
		}
	}


	//--------------------------------
	// Logic to make the game character rise and fall (part of the main draw function)
	//--------------------------------
	
		if (gameChar_y < floorPos_y)
    	{	
			var isContact = false;
			for (var i = 0; i < platforms.length; i++)
			{
				//checking whether game character is on one of the platforms
				if (platforms[i].checkContact(gameChar_world_x,gameChar_y) == true)
				{
					isContact = true;
					isFalling = false; //!!!important for standing facing forward on the platform
					//console.log('is on platform ' + i);//for future work
					break;
				}
			}
			
			if (wall.checkWallTop(gameChar_world_x, gameChar_y) == true)
				{
					isContact = true;
					isFalling = false; //!!!important for standing facing forward on the platform
					//console.log('is on platform ' + i);//for future work
				}

			// falling from the platform
			if (isContact == false)
			{
				isFalling = true; 
				gameChar_y += 4;
				walkingSound.stop();
			}
			
//			if (wall.checkWallTop(gameChar_world_x, gameChar_y) == true)
//			{
//				console.log("wall top contact");
//				isFalling = false;
//			}
			
		} 

		else 
		{
			isFalling = false;
		}

		//--------------------------------
		// Logic to rise the flag when flagpole is reached
		//--------------------------------

		if(flagpole.isReached == false)
		{
			checkFlagpole();	
		}

		//--------------------------------
		// Update real position of gameChar for collision detection
		//--------------------------------
		gameChar_world_x = gameChar_x - scrollPos;

		//--------------------------------
		// Logic to check if the game character is dead
		//--------------------------------
		checkPlayerDie();	

	}
//END OF THE MAIN DRAW FUNCTION


// ---------------------
// Change screens function
// ---------------------

function nextScreen()
{
	screen += 1;
}


// ---------------------
// Key control functions
// ---------------------

function keyPressed()
{
	//alter for different levels of the game
	if (screen == 0)
	{
		if (keyCode == 32)
		{
			nextScreen();
			backgroundSound.loop();
		}
	}
	
	else
	{
	// if statements to control the animation of the character when
	// keys are pressed

	//for future work
	//console.log("keyPressed: " + key);
	//console.log("keyPressed: " + keyCode);
    
    if (keyCode == 37)
    {
        isLeft = true;
    }
    
    else if (keyCode == 39)
    {
        isRight = true;
    }
    
    else if (keyCode == 32 && gameChar_y == floorPos_y && (!flagpole.isReached == true))
    {
        //console.log("jump");// for future work 
        gameChar_y = gameChar_y - 100;
		walkingSound.stop();
		jumpSound.play();
    }
	
	/* the previous "else if" connects the ability to jump with gameChar_y being equal to flootPos_y, because otherwise the character can literally fly with multiple press of the space key 
	therefore, below we make a special statement for the character on one of the platforms (so that she could not only fall from them, but jump as well, although gameChar_y !== floorPos_y)
	*/ 
	else if (keyCode == 32 && gameChar_y !== floorPos_y)
	{
		for (var i = 0; i < platforms.length; i++)
		{
			if (platforms[i].checkContact(gameChar_world_x,gameChar_y) == true || wall.checkWallTop(gameChar_world_x, gameChar_y) == true)
			{
				gameChar_y = gameChar_y - 100;
				walkingSound.stop();
				jumpSound.play();
			}
		}
		
			if (wall.checkWallTop(gameChar_world_x, gameChar_y) == true)
			{
				gameChar_y = gameChar_y - 100;
				walkingSound.stop();
				jumpSound.play();
			}
	}
	}

}


function keyReleased()
{	
	// if statements to control the animation of the character when 
	// keys are released

	//for future work
	//console.log("keyReleased: " + key);
	//console.log("keyReleased: " + keyCode);
    
    if (keyCode == 37)
    {
        isLeft = false;
    }
    
    else if (keyCode == 39)
    {
        isRight = false;
    }
}


// ------------------------------
// Game character general render function
// ------------------------------

function drawGameChar()
{
	if(lives < 1)
	{
		return;
	}
	
	if(isLeft && isFalling && (!flagpole.isReached == true))
	{
		jumpingLeft();
	}
	
	else if(isRight && isFalling && (!flagpole.isReached == true))
	{
		jumpingRight();
	}
	
	else if(isLeft && (!flagpole.isReached == true))
	{
		walkingLeft();
	}
	
	else if(isRight && (!flagpole.isReached == true))
	{
		walkingRight();
	}
	
	else if((isFalling || isPlummeting) && (!flagpole.isReached == true))
	{
		jumpingFacingForward();
	}
	
	else
	{
		standingFacingForward();
	}

}


// ---------------------------
// Background render functions
// ---------------------------


//----------------------------
//Functions to draw character's poses/statements

function jumpingLeft()
{     
//legs
	stroke(1);
	line(gameChar_x + 1, gameChar_y - 14,
		 gameChar_x - 12, gameChar_y - 23); //left leg
	line(gameChar_x - 12, gameChar_y - 23,
		 gameChar_x - 9.5, gameChar_y - 10); //left leg
	line(gameChar_x, gameChar_y - 15,
		 gameChar_x + 3, gameChar_y - 2); //right leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x + 4.5, gameChar_y - 1, 8, 8, PI - PI/1.5, 0 - PI/1.4);//right shoe
	arc(gameChar_x - 10, gameChar_y - 6, 8, 8, PI - PI/8, 0 - PI/3);//left shoe

//arms - BACK
	stroke(1);
	line(gameChar_x - 1, gameChar_y - 35,
		 gameChar_x - 13, gameChar_y - 38); //back arm
	line(gameChar_x - 13, gameChar_y - 38,
		 gameChar_x - 15, gameChar_y - 35); //back hand
	noStroke();    

//dress
	fill(255,99,71); //SandyBrown
	quad (gameChar_x, gameChar_y - 37,
		  gameChar_x - 9, gameChar_y - 20,
		  gameChar_x - 4, gameChar_y - 13,
		  gameChar_x + 12, gameChar_y - 10);

//arms - FRONT
	stroke(1);
	line(gameChar_x - 0.5, gameChar_y - 34,
		 gameChar_x + 11, gameChar_y - 25); //front arm
	line(gameChar_x + 11, gameChar_y - 25,
		 gameChar_x + 13, gameChar_y - 22); //front hand
	noStroke();

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(255,228,225); //MistyRose
	ellipse(gameChar_x - 9.5, gameChar_y - 41.5, 3, 3); // nose bulb
	fill(0);
	stroke(0.1);
	line(gameChar_x - 8, gameChar_y - 44.3,
		 gameChar_x - 5, gameChar_y - 43); // front eye
	line(gameChar_x - 5, gameChar_y - 43,
		 gameChar_x - 4.5, gameChar_y - 43.5); // lashes
	noStroke();
	ellipse(gameChar_x - 9.4, gameChar_y - 40.8, 0.5, 0.5); // nose front
	stroke(0.3);
	line(gameChar_x - 7.5, gameChar_y - 39,
		 gameChar_x - 5, gameChar_y - 38); // mouth
	line(gameChar_x - 5, gameChar_y - 38,
		 gameChar_x - 3.5, gameChar_y - 39); // smile
	noStroke();

//hair
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x + 2, gameChar_y - 59, 23, 23);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x - 5, gameChar_y - 53, 16, 16);
	fill(222,184,135); //Burlywood
	triangle(gameChar_x - 4, gameChar_y - 61, 
			 gameChar_x + 24, gameChar_y - 75, 
			 gameChar_x + 10, gameChar_y - 42);
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 6, gameChar_y - 52, 24, 24);
}


function jumpingRight()
{
//legs
	stroke(1);
	line(gameChar_x - 1, gameChar_y - 14,
		 gameChar_x + 12, gameChar_y - 23); //left leg
	line(gameChar_x + 12, gameChar_y - 23,
		 gameChar_x + 8.5, gameChar_y - 10); //right leg
	line(gameChar_x, gameChar_y - 15,
		 gameChar_x - 4, gameChar_y - 2); //left leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x + 10, gameChar_y - 6, 8, 8, PI + PI/3, 0 + PI/8);//right shoe
	arc(gameChar_x - 4.3, gameChar_y - 1, 8, 8, PI + PI/1.4, 0 + PI/1.6);//left shoe

//arms - BACK
	stroke(1);
	line(gameChar_x, gameChar_y - 35,
		 gameChar_x + 12, gameChar_y - 38); //back arm
	line(gameChar_x + 12, gameChar_y - 38,
		 gameChar_x + 14, gameChar_y - 35); //back hand
	noStroke();  

//dress
	fill(255,99,71); //SandyBrown
	quad(gameChar_x, gameChar_y - 37,
		 gameChar_x + 10, gameChar_y - 20,
		 gameChar_x + 5, gameChar_y - 13,
		 gameChar_x - 12, gameChar_y - 10);

//arms - FRONT
	stroke(1);
	line(gameChar_x - 0.5, gameChar_y - 34,
		 gameChar_x - 12, gameChar_y - 25); //front arm
	line(gameChar_x - 12, gameChar_y - 25,
		 gameChar_x - 14, gameChar_y - 22); //front hand
	noStroke();

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(255,228,225); //MistyRose
	ellipse(gameChar_x + 9.4, gameChar_y - 41.5, 3, 3); // nose bulb
	fill(0);
	stroke(0.1);
	line(gameChar_x + 7.5, gameChar_y - 44.3,
		 gameChar_x + 3.9, gameChar_y - 43); // front eye
	line(gameChar_x + 3.9, gameChar_y - 43,
		 gameChar_x + 3.4, gameChar_y - 43.5); // lashes
	noStroke();
	ellipse(gameChar_x + 9.4, gameChar_y - 40.8, 0.5, 0.5); // nose front
	stroke(0.3);
	line(gameChar_x + 6.5, gameChar_y - 39,
		 gameChar_x + 4, gameChar_y - 38); // mouth
	line(gameChar_x + 4, gameChar_y - 38,
		 gameChar_x + 2.5, gameChar_y - 39); // smile
	noStroke();

//hair
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 4, gameChar_y - 56, 22, 22);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x + 5, gameChar_y - 52, 16, 16);
	fill(222,184,135); //Burlywood
	triangle(gameChar_x + 4, gameChar_y - 61, 
			 gameChar_x - 24, gameChar_y - 75, 
			 gameChar_x - 10, gameChar_y - 42);
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x - 8, gameChar_y - 54, 29, 29);
	//extra
	fill(176,224,230,190);
	ellipse(gameChar_x - 12, gameChar_y - 56, 15, 15);
	fill(176,224,230,220);
	ellipse(gameChar_x - 2, gameChar_y - 50, 7, 7);
	fill(176,224,230,210);
	ellipse(gameChar_x - 15, gameChar_y - 45, 3, 3);
	fill(176,224,230,255);
	ellipse(gameChar_x - 18, gameChar_y - 48, 1.5, 1.5);
	fill(128,0,128,60);
	ellipse(gameChar_x - 4, gameChar_y - 61, 10, 10);
	fill(128,0,128,130);
	ellipse(gameChar_x - 7, gameChar_y - 48, 12, 12);
	fill(128,0,128,210);
	ellipse(gameChar_x + 2.5, gameChar_y - 57, 3, 3);
	fill(128,0,128,255);
	ellipse(gameChar_x + 3.5, gameChar_y - 52, 1.5, 1.5);
}


function walkingLeft()
{    
//legs
	stroke(1);
	line(gameChar_x + 1, gameChar_y - 15,
		 gameChar_x - 9.5, gameChar_y - 4); //left leg
	line(gameChar_x - 3.5, gameChar_y - 15,
		 gameChar_x + 3, gameChar_y - 2); //right leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x - 13, gameChar_y - 3.5, 8, 8, PI + QUARTER_PI, 0 + QUARTER_PI);//left shoe
	arc(gameChar_x + 4, gameChar_y + 2.5, 8, 8, PI, 0 - QUARTER_PI);//right shoe

//arms - BACK
	stroke(1);
	line(gameChar_x - 1, gameChar_y - 35,
		 gameChar_x - 10, gameChar_y - 24); //back arm
	line(gameChar_x - 10, gameChar_y - 24,
		 gameChar_x - 12.5, gameChar_y - 23); //back hand
	noStroke();    

//dress
	fill(255,99,71); //SandyBrown
	triangle(gameChar_x, gameChar_y - 37,
			 gameChar_x - 12, gameChar_y - 15.5,
			 gameChar_x + 12, gameChar_y - 11);

//arms - FRONT
	stroke(1);
	line(gameChar_x - 0.5, gameChar_y - 34,
		 gameChar_x + 5, gameChar_y - 20); //front arm
	line(gameChar_x + 5, gameChar_y - 20,
		 gameChar_x + 7.5, gameChar_y - 19); //front hand
	noStroke();

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(255,228,225); //MistyRose
	ellipse(gameChar_x - 9.5, gameChar_y - 41.5, 3, 3); // nose bulb
	fill(0);
	stroke(0.1);
	line(gameChar_x - 8, gameChar_y - 44.3,
		 gameChar_x - 5, gameChar_y - 43); // front eye
	line(gameChar_x - 5, gameChar_y - 43,
		 gameChar_x - 4.5, gameChar_y - 43.5); // lashes
	noStroke();
	ellipse(gameChar_x - 9.4, gameChar_y - 40.8, 0.5, 0.5); // nose front
	stroke(0.3);
	line(gameChar_x - 7.5, gameChar_y - 39,
		 gameChar_x - 5, gameChar_y - 38); // mouth
	line(gameChar_x - 5, gameChar_y - 38,
		 gameChar_x - 3.5, gameChar_y - 39); // smile
	noStroke();

//hair
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x + 2, gameChar_y - 59, 23, 23);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x - 5, gameChar_y - 53, 16, 16);
	fill(222,184,135); //Burlywood
	triangle(gameChar_x - 4, gameChar_y - 61, 
			 gameChar_x + 24, gameChar_y - 75, 
			 gameChar_x + 10, gameChar_y - 42);
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 6, gameChar_y - 52, 24, 24);
}


function walkingRight()
{
	//legs
	stroke(1);
	line(gameChar_x - 2, gameChar_y - 15,
		 gameChar_x + 8.5, gameChar_y - 4); //left leg
	line(gameChar_x + 2.5, gameChar_y - 15,
		 gameChar_x - 4, gameChar_y - 2); //right leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x + 12, gameChar_y - 3.5, 8, 8, PI - QUARTER_PI, 0 - QUARTER_PI);//left shoe
	arc(gameChar_x - 5, gameChar_y + 2.5, 8, 8, PI + QUARTER_PI, 0);//right shoe

//arms - BACK
	stroke(1);
	line(gameChar_x, gameChar_y - 35,
		 gameChar_x + 9, gameChar_y - 24); //back arm
	line(gameChar_x + 9, gameChar_y - 24,
		 gameChar_x + 11.5, gameChar_y - 23); //back hand
	noStroke();  

//dress
	fill(255,99,71); //SandyBrown
	triangle(gameChar_x, gameChar_y - 37,
			 gameChar_x - 12, gameChar_y - 11,
			 gameChar_x + 12, gameChar_y - 15.5);

//arms - FRONT
	stroke(1);
	line(gameChar_x - 0.5, gameChar_y - 34,
		 gameChar_x - 6, gameChar_y - 20); //front arm
	line(gameChar_x - 6, gameChar_y - 20,
		 gameChar_x - 8.5, gameChar_y - 19); //front hand
	noStroke();

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(255,228,225); //MistyRose
	ellipse(gameChar_x + 9.4, gameChar_y - 41.5, 3, 3); // nose bulb
	fill(0);
	stroke(0.1);
	line(gameChar_x + 7.5, gameChar_y - 44.3,
		 gameChar_x + 3.9, gameChar_y - 43); // front eye
	line(gameChar_x + 3.9, gameChar_y - 43,
		 gameChar_x + 3.4, gameChar_y - 43.5); // lashes
	noStroke();
	ellipse(gameChar_x + 9.4, gameChar_y - 40.8, 0.5, 0.5); // nose front
	stroke(0.3);
	line(gameChar_x + 6.5, gameChar_y - 39,
		 gameChar_x + 4, gameChar_y - 38); // mouth
	line(gameChar_x + 4, gameChar_y - 38,
		 gameChar_x + 2.5, gameChar_y - 39); // smile
	noStroke();

//hair
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 4, gameChar_y - 56, 22, 22);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x + 5, gameChar_y - 52, 16, 16);
	fill(222,184,135); //Burlywood
	triangle(gameChar_x + 4, gameChar_y - 61, 
			 gameChar_x - 24, gameChar_y - 75, 
			 gameChar_x - 10, gameChar_y - 42);
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x - 8, gameChar_y - 54, 29, 29);
	//extra
	fill(176,224,230,190);
	ellipse(gameChar_x - 12, gameChar_y - 56, 15, 15);
	fill(176,224,230,220);
	ellipse(gameChar_x - 2, gameChar_y - 50, 7, 7);
	fill(176,224,230,210);
	ellipse(gameChar_x - 15, gameChar_y - 45, 3, 3);
	fill(176,224,230,255);
	ellipse(gameChar_x - 18, gameChar_y - 48, 1.5, 1.5);
	fill(128,0,128,60);
	ellipse(gameChar_x - 4, gameChar_y - 61, 10, 10);
	fill(128,0,128,130);
	ellipse(gameChar_x - 7, gameChar_y - 48, 12, 12);
	fill(128,0,128,210);
	ellipse(gameChar_x + 2.5, gameChar_y - 57, 3, 3);
	fill(128,0,128,255);
	ellipse(gameChar_x + 3.5, gameChar_y - 52, 1.5, 1.5);
}


function jumpingFacingForward()
{     
//arms
	stroke(1);
	line(gameChar_x - 1, gameChar_y - 32,
		 gameChar_x - 15, gameChar_y - 40); //left arm
	line(gameChar_x - 15, gameChar_y - 40,
		 gameChar_x - 17.5, gameChar_y - 41); //left hand
	line(gameChar_x, gameChar_y - 32,
		 gameChar_x + 14, gameChar_y - 40); //right arm
	line(gameChar_x + 14, gameChar_y - 40,
		 gameChar_x + 16.5, gameChar_y - 41); //right hand

//legs
	line(gameChar_x - 4, gameChar_y - 19,
		 gameChar_x - 2, gameChar_y - 5); //left leg
	line(gameChar_x + 3, gameChar_y - 25,
		 gameChar_x + 2, gameChar_y - 8); //right leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x - 2, gameChar_y - 2.5, 5, 5, PI, 0);//left shoe
	arc(gameChar_x + 4, gameChar_y - 5, 10, 10, PI, 0);//right shoe

//dress
	fill(255,99,71); //SandyBrown
	quad(gameChar_x, gameChar_y - 37,
		 gameChar_x - 12, gameChar_y - 17,
		 gameChar_x, gameChar_y - 17,
		 gameChar_x + 10, gameChar_y - 23);

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(0);
	ellipse(gameChar_x - 5, gameChar_y - 42, 3, 2); // left eye
	ellipse(gameChar_x + 5, gameChar_y - 42, 3, 2); // right eye
	ellipse(gameChar_x - 0.5, gameChar_y - 40, 0.5, 0.5); // nose left
	ellipse(gameChar_x + 0.5, gameChar_y - 40, 0.5, 0.5); // nose right
	stroke(0.3);
	line(gameChar_x - 2, gameChar_y - 38,
		 gameChar_x + 1, gameChar_y - 38); // mouth
	noStroke();
	ellipse(gameChar_x, gameChar_y - 37.5, 2, 2); // lips

//hair
	fill(222,184,135); //Burlywood
	triangle(gameChar_x - 10, gameChar_y - 60, 
			 gameChar_x + 10, gameChar_y - 75, 
			  gameChar_x + 5, gameChar_y - 45);
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x - 7, gameChar_y - 59, 20, 20);
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 5, gameChar_y - 55, 20, 20);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x - 5, gameChar_y - 53, 16, 16);
}


function standingFacingForward()
{
//arms
	stroke(1);
	line(gameChar_x - 1, gameChar_y - 35,
		 gameChar_x - 10, gameChar_y - 24); //left arm
	line(gameChar_x - 10, gameChar_y - 24,
		 gameChar_x - 12.5, gameChar_y - 23); //left hand
	line(gameChar_x, gameChar_y - 35,
		 gameChar_x + 9, gameChar_y - 24); //right arm
	line(gameChar_x + 9, gameChar_y - 24,
		 gameChar_x + 11.5, gameChar_y - 23); //right hand

//legs
	line(gameChar_x - 4, gameChar_y - 15,
		 gameChar_x - 4, gameChar_y - 2); //left leg
	line(gameChar_x + 3, gameChar_y - 15,
		 gameChar_x + 3, gameChar_y - 2); //right leg
	noStroke();
	fill(218, 165, 32); // Goldenrod
	arc(gameChar_x - 5, gameChar_y + 2.5, 8, 8, PI, 0);//left shoe
	arc(gameChar_x + 5, gameChar_y + 2.5, 8, 8, PI, 0);//right shoe

//dress
	fill(255,99,71); //SandyBrown
	triangle(gameChar_x, gameChar_y - 37,
			 gameChar_x - 12, gameChar_y - 13,
			 gameChar_x + 12, gameChar_y - 13);

//head
	fill(255,228,225); //MistyRose 
	ellipse(gameChar_x, gameChar_y - 45, 20, 20);

//face
	fill(0);
	ellipse(gameChar_x - 5, gameChar_y - 42, 3, 2); // left eye
	ellipse(gameChar_x + 5, gameChar_y - 42, 3, 2); // right eye
	ellipse(gameChar_x - 0.5, gameChar_y - 40, 0.5, 0.5); // nose left
	ellipse(gameChar_x + 0.5, gameChar_y - 40, 0.5, 0.5); // nose right
	stroke(0.3);
	line(gameChar_x - 2, gameChar_y - 38,
		 gameChar_x + 1, gameChar_y - 38); // mouth
	noStroke();
	ellipse(gameChar_x, gameChar_y - 37.5, 2, 2); // lips

//hair
	fill(222,184,135); //Burlywood
	triangle(gameChar_x - 10, gameChar_y - 60, 
			 gameChar_x + 10, gameChar_y - 75, 
			 gameChar_x + 5, gameChar_y - 45);
	fill(255,160,122); //LightSalmon
	ellipse(gameChar_x - 7, gameChar_y - 59, 20, 20);
	fill(128,0,128); //Purple
	ellipse(gameChar_x + 5, gameChar_y - 55, 20, 20);
	fill(176,224,230); //PowderBlue
	ellipse(gameChar_x - 5, gameChar_y - 53, 16, 16);
}



//----------------------------
// Function to draw cloud objects

function drawClouds()
{
	for(var i = 0; i < clouds.length; i++)
	{
		fill(240,248,255);
		ellipse(clouds[i].x_pos, clouds[i].y_pos, 
				130*clouds[i].size, 140*clouds[i].size); 
		fill(216,191,216);
		ellipse(clouds[i].x_pos - 50*clouds[i].size, clouds[i].y_pos + 30*clouds[i].size, 
				150*clouds[i].size, 100*clouds[i].size);
		fill(255,228,225,150);
		ellipse(clouds[i].x_pos + 30*clouds[i].size, clouds[i].y_pos + 30*clouds[i].size, 
				clouds[i].size*140, clouds[i].size*120);
		fill(250,235,215,200);
		ellipse(clouds[i].x_pos, clouds[i].y_pos, 
				clouds[i].size*120, clouds[i].size*105);
		fill(245,255,250);
		ellipse(clouds[i].x_pos - 85*clouds[i].size, clouds[i].y_pos + 30*clouds[i].size, 
				clouds[i].size*60, clouds[i].size*60);
		fill(230,230,250,150);
		beginShape();
		vertex(clouds[i].x_pos + 50*clouds[i].size, clouds[i].y_pos - 30*clouds[i].size);
		bezierVertex(clouds[i].x_pos + 220*clouds[i].size, clouds[i].y_pos, 
					 clouds[i].x_pos + 130*clouds[i].size, clouds[i].y_pos + 110*clouds[i].size, 
					 clouds[i].x_pos, clouds[i].y_pos + 80*clouds[i].size);
		bezierVertex(clouds[i].x_pos - 80*clouds[i].size, clouds[i].y_pos + 60*clouds[i].size, 
					 clouds[i].x_pos + 230*clouds[i].size, clouds[i].y_pos + 20*clouds[i].size, 
					 clouds[i].x_pos + 50*clouds[i].size, clouds[i].y_pos - 30*clouds[i].size);
		endShape();
	}
}


//----------------------------
// Function to draw mountains objects

function drawMountains()
{
	for(var i = 0; i < mountains.length; i++)
	{
		//main form
		fill(135,238,238);
		beginShape();
		vertex(mountains[i].x_pos + 512*mountains[i].width, 432);
		vertex(mountains[i].x_pos + 424*mountains[i].width, 300);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 250);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 200);
		vertex(mountains[i].x_pos + 224*mountains[i].width, 180);
		vertex(mountains[i].x_pos + 134*mountains[i].width, 180);
		vertex(mountains[i].x_pos + 74*mountains[i].width, 100);
		vertex(mountains[i].x_pos, 150);
		vertex(mountains[i].x_pos, 432);
		vertex(mountains[i].x_pos + 512*mountains[i].width, 432);
		endShape(CLOSE);

		//sunrise
		fill(255,228,181,200);
		beginShape();
		vertex(mountains[i].x_pos + 274*mountains[i].width, 220);
		vertex(mountains[i].x_pos + 224*mountains[i].width, 200);
		vertex(mountains[i].x_pos + 134*mountains[i].width, 200);
		vertex(mountains[i].x_pos + 74*mountains[i].width, 200);
		vertex(mountains[i].x_pos, 150);
		vertex(mountains[i].x_pos + 74*mountains[i].width, 100);
		vertex(mountains[i].x_pos + 134*mountains[i].width, 180);
		vertex(mountains[i].x_pos + 224*mountains[i].width, 180);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 200);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 220);
		endShape(CLOSE);

		//closer form
		fill(72,209,204);
		beginShape();
		vertex(mountains[i].x_pos, 300);
		vertex(mountains[i].x_pos, 432);
		vertex(mountains[i].x_pos + 349*mountains[i].width, 432);
		vertex(mountains[i].x_pos + 404*mountains[i].width, 350);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 300);
		vertex(mountains[i].x_pos + 179*mountains[i].width, 270);
		vertex(mountains[i].x_pos + 124*mountains[i].width, 270);
		vertex(mountains[i].x_pos + 34*mountains[i].width, 350);
		vertex(mountains[i].x_pos, 300);
		endShape();

		//the closest form
		fill(95,158,160);
		beginShape();
		vertex(mountains[i].x_pos + 324*mountains[i].width, 432);
		vertex(mountains[i].x_pos + 324*mountains[i].width, 350);
		vertex(mountains[i].x_pos + 274*mountains[i].width, 350);
		vertex(mountains[i].x_pos + 244*mountains[i].width, 300);
		vertex(mountains[i].x_pos + 174*mountains[i].width, 300);
		vertex(mountains[i].x_pos + 174*mountains[i].width, 330);
		vertex(mountains[i].x_pos + 124*mountains[i].width, 360);
		vertex(mountains[i].x_pos + 74*mountains[i].width, 360);
		vertex(mountains[i].x_pos + 74*mountains[i].width, 400);
		vertex(mountains[i].x_pos + 24*mountains[i].width, 400);
		vertex(mountains[i].x_pos + 24*mountains[i].width, 432);
		vertex(mountains[i].x_pos + 324*mountains[i].width, 432);
		endShape();
	}
}


//----------------------------
// Function to draw trees objects

function drawTrees()
{
	for(var i = 0; i < trees_x.length; i++)
	{
		colorMode(RGB);
		let from = color(255,228,196);
		let to = color(72,61,139);
		colorMode(RGB);
		let interA = lerpColor(from, to, 0.5);
		let interB = lerpColor(from, to, 0.25);
		let interC = lerpColor(from, to, 0.45);
		let interD = lerpColor(from, to, 0.65);
		let interE = lerpColor(from, to, 0.80);
		let interF = lerpColor(from, to, 0.99);

		//trunk
		fill(from);
		ellipse(trees_x[i], trees_y + 125, 40, 40);
		fill(interA);
		ellipse(trees_x[i], trees_y + 90, 30, 30);
		fill(interB);
		ellipse(trees_x[i], trees_y + 65, 20, 20);
		fill(interC);
		ellipse(trees_x[i], trees_y + 40, 30, 30);
		fill(interD);
		ellipse(trees_x[i], trees_y + 5, 40, 40);

		//branches
		fill(interE);
		beginShape();
		vertex(trees_x[i], trees_y + 5);
		vertex(trees_x[i] - 50, trees_y - 25);
		vertex(trees_x[i] - 55, trees_y - 75);
		vertex(trees_x[i] - 35, trees_y - 25);
		vertex(trees_x[i], trees_y + 5);
		endShape();
		fill(interF);
		beginShape();
		vertex(trees_x[i], trees_y + 5);
		vertex(trees_x[i] + 50, trees_y - 25);
		vertex(trees_x[i] + 55, trees_y - 75);
		vertex(trees_x[i] + 35, trees_y - 25);
		vertex(trees_x[i], trees_y +5);
		endShape();
		fill(to);
		beginShape();
		vertex(trees_x[i], trees_y + 5);
		vertex(trees_x[i] - 25, trees_y - 95);
		vertex(trees_x[i], trees_y - 175);
		vertex(trees_x[i] + 25, trees_y - 95);
		vertex(trees_x[i], trees_y + 5);
		endShape();

		//figures on the trunk
		fill(interF);
		triangle(trees_x[i] - 15, trees_y + 135, 
				 trees_x[i], trees_y + 110, 
				 trees_x[i] + 15, trees_y + 135);
		fill(interD);
		triangle(trees_x[i] - 10, trees_y + 97,
				 trees_x[i], trees_y + 78, 
				 trees_x[i] + 10, trees_y + 97);
		fill(interC);
		triangle(trees_x[i] - 7, trees_y + 70, 
				 trees_x[i], trees_y + 57, 
				 trees_x[i] + 7, trees_y + 70);
		fill(interA);
		triangle(trees_x[i] - 10, trees_y + 47,
				 trees_x[i], trees_y + 28, 
				 trees_x[i] + 10, trees_y + 47);
		fill(from);
		rect(trees_x[i] - 10, trees_y - 5, 20, 20);	
	}
}




// ---------------------------------
// Canyon render and check functions
// ---------------------------------

// Function to draw canyon objects.

function drawCanyon(t_canyon)
{
	//canyon
	fill(25,25,112);
	quad(t_canyon.x_pos + t_canyon.width, floorPos_y, 
		 t_canyon.x_pos + t_canyon.width*30 + 50, floorPos_y,
		 t_canyon.x_pos + t_canyon.width*30 + 50, height,
		 t_canyon.x_pos + t_canyon.width, height);
	//peaks
	fill(72,209,204);
	triangle(t_canyon.x_pos + t_canyon.width*30 + 45, 576, // rightmost peak - right angle
			 t_canyon.x_pos + t_canyon.width*20 + 40, 470, // upper angle
			 t_canyon.x_pos + t_canyon.width*10 + 35, 576); // left angle
	triangle(t_canyon.x_pos + t_canyon.width*10 + 35, 576, // 2nd from the right - right angle 
			 t_canyon.x_pos + t_canyon.width*5 + 30, 450, // upper angle
			 t_canyon.x_pos + t_canyon.width*2 + 25, 576); // left angle
	triangle(t_canyon.x_pos + t_canyon.width*2 + 25, 576, // 3rd from the right - right angle
			 t_canyon.x_pos + t_canyon.width*2 + 20, 480, // upper angle
			 t_canyon.x_pos + t_canyon.width*2 + 15, 576); // left angle
	triangle(t_canyon.x_pos + t_canyon.width + 15, 576, //leftmost - right angle
			 t_canyon.x_pos + t_canyon.width + 10, 460, // upper angle
			 t_canyon.x_pos + t_canyon.width + 5, 576); // left angle
}

// Function to check character is over a canyon.

function checkCanyon(t_canyon)
{
	if(gameChar_world_x > (t_canyon.x_pos + t_canyon.width) && 
	  (gameChar_world_x < (t_canyon.x_pos + t_canyon.width*30 + 50) && 
	   gameChar_y > 423) && 
	   gameChar_y >= floorPos_y)
	{
		isPlummeting = true;
		walkingSound.stop();
		fallDownSound.play();
	}	
}

// ----------------------------------
// Collectable items render and check functions
// ----------------------------------

// Function to draw collectable objects.

function drawCollectable(t_collectable)
{
	noStroke();
	fill(255,215,0);
	ellipse(t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2, t_collectable.size + 3, t_collectable.size + 3);
	fill(128,0,128);
	ellipse(t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2, t_collectable.size, t_collectable.size)
	stroke(0,255,255);
	//left part of the head
	quad(t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*12,
		 t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*2,
		 t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7);
	//right part of the head
	quad(t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*12,
		 t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*2,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7);
	//central part of the head
	quad(t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*2,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*8);
	//left ear
	quad(t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7,
		 t_collectable.x_pos - t_collectable.size/50*13, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*17,
		 t_collectable.x_pos - t_collectable.size/50*15, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7);
	//right ear
	quad(t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos + t_collectable.size/50*15, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7,
		 t_collectable.x_pos + t_collectable.size/50*13, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*17);
	//the leftmost part
	quad(t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos - t_collectable.size/50*15, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7,
		 t_collectable.x_pos - t_collectable.size/50*20, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50,
		 t_collectable.x_pos - t_collectable.size/50*17, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*10);
	//the rightmost part
	quad(t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos + t_collectable.size/50*15, t_collectable.y_pos - t_collectable.size/2 - t_collectable.size/50*7,
		 t_collectable.x_pos + t_collectable.size/50*20, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50,
		 t_collectable.x_pos + t_collectable.size/50*17, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*10);
	//left cheek
	quad(t_collectable.x_pos - t_collectable.size/50*17, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*10,
		 t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*8,
		 t_collectable.x_pos - t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	//right cheek
	quad(t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*8,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3,
		 t_collectable.x_pos + t_collectable.size/50*17, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*10,
		 t_collectable.x_pos + t_collectable.size/50*10, t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	beginShape();
	vertex(t_collectable.x_pos - t_collectable.size/50*10, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	vertex(t_collectable.x_pos, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*3);
	vertex(t_collectable.x_pos + t_collectable.size/50*10, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	vertex(t_collectable.x_pos + t_collectable.size/50*5, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	vertex(t_collectable.x_pos, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*23);
	vertex(t_collectable.x_pos - t_collectable.size/50*5, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	vertex(t_collectable.x_pos - t_collectable.size/50*10, 
		   t_collectable.y_pos - t_collectable.size/2 + t_collectable.size/50*18);
	endShape();
}

// Function to check character has collected an item.

function checkCollectable(t_collectable)
{
	if (dist(gameChar_world_x, gameChar_y, t_collectable.x_pos, t_collectable.y_pos - t_collectable.size/2) < 30)
    {
        t_collectable.isFound = true;
		game_score += 1;
		itemFoundSound.play();
    }
}



// ----------------------------------
// Flagpole render and check functions
// ----------------------------------

// Function to draw the flagpole

function renderFlagpole()
{
	push();
	strokeWeight(5);
	stroke(100);
	line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 250);
	fill(255,0,0);
	noStroke();
	
	if(flagpole.isReached)
	{
		rect(flagpole.x_pos, floorPos_y - 250, 50, 50);
		
	}
	else
	{
		rect(flagpole.x_pos, floorPos_y - 50, 50, 50);
	}
	
	pop();
}

// Function to check the flagpole

function checkFlagpole()
{
	var d = abs(gameChar_world_x - flagpole.x_pos);
	if(d < 20)
	{
		flagpole.isReached = true;
		flagSound.play();
		backgroundSound.stop();
		levelCompleteSound.play();
	}	
}



// ----------------------------------
// Start Game Function 
// ----------------------------------


function startGame()
{	
	gameChar_x = width/2;
	gameChar_y = floorPos_y;
	trees_y = height/2;

	// Variable to control the background scrolling.
	scrollPos = 0;

	// Variable to store the real position of the gameChar in the game
	// world. Needed for collision detection.
	gameChar_world_x = gameChar_x - scrollPos;

	// Boolean variables to control the movement of the game character.
	isLeft = false;
	isRight = false;
	isFalling = false;
	isPlummeting = false;

	// Initialise arrays of scenery objects.
	
	clouds = 
	[
		{x_pos: -1900, y_pos: 180, size: 1.2},
		{x_pos: -1300, y_pos: 120, size: 1},
		{x_pos: -600, y_pos: 100, size: 0.7},
		{x_pos: -200, y_pos: 170, size: 1.2},
		{x_pos: 200, y_pos: 80, size: 0.6},
		{x_pos: 950, y_pos: 170, size: 1},
		{x_pos: 1400, y_pos: 190, size: 0.5},
		{x_pos: 1700, y_pos: 70, size: 0.5},
		{x_pos: 1900, y_pos: 200, size: 1},
		{x_pos: 2400, y_pos: 100, size: 0.7},
		{x_pos: 3200, y_pos: 180, size: 2}
	];
	
	mountains = 
	[
		{x_pos: -2210, width: 0.6},
		{x_pos: -1805, width: 1},
		{x_pos: -1100, width: 1.7},
		{x_pos: 0, width: 0.8},
		{x_pos: 642, width: 0.5},
//		{x_pos: 1200, width: 1.5},
		{x_pos: 2100, width: 0.5},
		{x_pos: 2600, width: 1},
	];
	
	trees_x = 
	[
		-2400, 
		-2250, 
		-1400, 
		-1250, 
		-1500, 
		-800, 
		-650, 
		-500, 
		100, 
		300, 
		800, 
		1080,
		1300,
		1550,  
		1850, 
		2150, 
		2300, 
		2700, 
		2850
	];
	
	canyons = 
	[
		{x_pos: -1890, width: 1},
		{x_pos: -1197, width: 0.2},
		{x_pos: -1163, width: 0.4},
		{x_pos: -230, width: 0.5},
		{x_pos: -55, width: 0.1},
		{x_pos: 410, width: 0.1},
		{x_pos: 576, width: 0.5},
		{x_pos: 900, width: 1},
		{x_pos: 1100, width: 1},
		{x_pos: 2010, width: 1},
		{x_pos: 2355, width: 0.5},
		{x_pos: 2505, width: 1}
	];
	
	wall = 
	{
		x: 1720, 
		y: [],
		length: 50,
		drawWall: function ()
		{
			push();
			for (i = 0; i < this.y.length; i++)
			{
				stroke(0);
				strokeWeight(3);
				stroke(random(150,250), random(100,200), random(150,200));
				fill(0);
				rect(this.x, this.y[i], this.length, 50);
			}
			pop();
		},
		
		checkWallSide: function ()
		{
			var dLeft = (this.x - gameChar_world_x);
			var dRight = (gameChar_world_x - (this.x + this.length));
			
			if(dLeft < 20 && gameChar_y > (floorPos_y - 250) && dLeft >=0)
			{
				isRight = false; 
			}	
			
			if (dRight < 20 && gameChar_y > (floorPos_y - 250) && dRight >=0)
			{
				isLeft = false;
			}
		},
		
		checkWallTop: function(character_X, character_Y)
		{
			if(character_X > this.x && character_X < this.x + this.length)
			{			
					var d = this.y[4] - character_Y;
					if (d >= 0 && d < 5)
					{
						return true;	
					}
			}
		return false;
		},
	}; 

	for (i = 1; i < 6; i++)
	{
		wall.y.push(floorPos_y - 50*i);
	}

	
	collectables = 
	[
		{x_pos: -2326, y_pos: floorPos_y - 190, size: 50, isFound: false},
		{x_pos: -2000, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: -1600, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: -900, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: -400, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: -100, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: 350, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: 700, y_pos: floorPos_y, size: 50, isFound: false},
		//for platforms
		{x_pos: 1130, y_pos: floorPos_y - 300, size: 50, isFound: false},
		{x_pos: 1642, y_pos: floorPos_y - 150, size: 50, isFound: false},
		{x_pos: 1744, y_pos: floorPos_y - 280, size: 50, isFound: false},
		//
		{x_pos: 1950, y_pos: floorPos_y, size: 50, isFound: false},
		{x_pos: 2450, y_pos: floorPos_y, size: 50, isFound: false}
	];
	
	platforms = [];
	platforms.push(createPlatforms(-2397,floorPos_y - 95, 140));
	platforms.push(createPlatforms(canyons[2].x_pos - 70,floorPos_y - 95, 140));
	platforms.push(createPlatforms(canyons[3].x_pos + 50,floorPos_y - 95, 140));
	platforms.push(createPlatforms(canyons[6].x_pos - 130,floorPos_y - 100, 140));
	//platforms for the wall 
	platforms.push(createPlatforms(wall.x - 785,floorPos_y - 100, 140));
	platforms.push(createPlatforms(wall.x - 590,floorPos_y - 140, 140));
	platforms.push(createPlatforms(wall.x - 550,floorPos_y - 270, 140));
	platforms.push(createPlatforms(wall.x - 405,floorPos_y - 190, 140));
	platforms.push(createPlatforms(wall.x - 405,floorPos_y - 320, 140));
	platforms.push(createPlatforms(wall.x - 200,floorPos_y - 300, 140));
	platforms.push(createPlatforms(wall.x - 150,floorPos_y - 95, 140));
	//
	platforms.push(createPlatforms(canyons[10].x_pos - 20,floorPos_y - 95, 140));

	game_score = 0;
	
	flagpole = 
	{
		isReached: false,
		x_pos: 3000
	};
	
}


// ----------------------------------
// Function to check if the game character is dead 
// ----------------------------------

function checkPlayerDie()
{
	if(gameChar_y > height && lives >= 1)
	{
		lives -= 1;
		startGame();
	}
}


// ----------------------------------
// Function to draw the lives' tokens
// ----------------------------------

function lifeTokens()
{
	for(var i = 0; i < lives; i++)
	{
		var token; 
		token = 
				[
					{x: 30, y: 60},
					{x: 70, y: 60},
					{x: 110, y: 60}
				];
		
		//head
        fill(255,228,225); //MistyRose 
        ellipse(token[i].x, token[i].y, 20, 20);

        //face
        fill(0);
        ellipse(token[i].x - 5,  token[i].y + 3, 3, 2); // left eye
        ellipse(token[i].x + 5, token[i].y + 3, 3, 2); // right eye
        ellipse(token[i].x - 0.5, token[i].y + 5, 0.5, 0.5); // nose left
        ellipse(token[i].x + 0.5, token[i].y + 5, 0.5, 0.5); // nose right
        stroke(0.3);
        line(token[i].x - 2, token[i].y + 7,
             token[i].x + 1, token[i].y + 7); // mouth
        noStroke();
        ellipse(token[i].x, token[i].y + 7.5, 2, 2); // lips

        //hair
        fill(222,184,135); //Burlywood
        triangle(token[i].x - 10, token[i].y - 15, 
                 token[i].x + 10, token[i].y - 30, 
                 token[i].x + 5, token[i].y);
        fill(255,160,122); //LightSalmon
        ellipse(token[i].x - 7, token[i].y - 14, 20, 20);
        fill(128,0,128); //Purple
        ellipse(token[i].x + 5, token[i].y - 10, 20, 20);
        fill(176,224,230); //PowderBlue
        ellipse(token[i].x - 5, token[i].y - 8, 16, 16);
	
	}
}


// ----------------------------------
// Function to draw the signpost 
// ----------------------------------

function drawSignpost(x)
{
	push();
	strokeWeight(15);
	stroke(0);
	line(x, floorPos_y, x-10, floorPos_y - 70);
	strokeWeight(4);
	fill(255);
	quad(x - 60, floorPos_y - 70, x + 40, floorPos_y - 70, x + 60, floorPos_y - 140, x - 40, floorPos_y - 140);
	noStroke();
	fill(0);
	textSize(23);
	textFont(myFont[0]);
	textAlign(CENTER, CENTER);
	text("Middle of", x, floorPos_y - 125);
	textSize(20);
	text("<--------", x, floorPos_y - 105);
	text("n o w h e r e", x-5, floorPos_y - 90);
	pop();
}


// ----------------------------------
// Function to create platforms
// ----------------------------------


function createPlatforms(x,y,length)
{
	//create a platform as an object with parameters and a method to draw a platform 
	var p = 
	{
		x: x,
		y: y,
		length: length,
		draw: function()
		{
			push();
			strokeWeight(3);
			noFill();
			stroke(random(150,250), random(100,200), random(150,200));
			rect(this.x, this.y, this.length, 30);
			noStroke();
			fill(173,255,47);
			textSize(20);
			if (this.x > (-1000) && this.x < (-500) ||
				this.x > (-100) && this.x < 800 ||
				this.x > 1000 && this.x < 2000)
			{
				text("<<< THIS WAY", this.x + 2, this.y + 23);	
			}
			else if (this.x < (-1700))
			{
				text("HA-HA GOT U", this.x + 2, this.y + 23);	
			}
			else
			{
				text("THIS WAY >>>", this.x + 2, this.y + 23);	
			}
			noFill();
			pop();
		},
		checkContact: function(char_X, char_y)
		{
			if(char_X > this.x && char_X < this.x + this.length)
			{
				var d = this.y - char_y;
				if (d >= 0 && d < 5)
				{
					return true;	
				}
			}
		return false;
		}
	} 
	
	return p;
}


//-------------------------------------------
// Function to draw the GAME OVER poster
//-------------------------------------------

function gameOverPoster()
{
	push();
	stroke(255,0,0);
	fill(255,200,200,200);
	ellipse(1.9*width/3, 1.65*height/3, 370, 370);
	stroke(255);
	fill(255,0,0);
	ellipse(width/3, 1.65*height/3, 300, 300);
	stroke(255,200,200,200);
	fill(255,0,0,100);
	ellipse(width/2, 1.75*height/3, 200, 200);
	stroke(0);
	fill(0);
	textSize(55);
	textFont(myFont[1]);
	textAlign(CENTER, CENTER);
	text("G A M E   O V E R", width/2, height/2);
	textSize(45);
	text("Press space to continue", width/2, height/2 + 100);
	pop();
	jumpSound.stop();
	walkingSound.stop();
	backgroundSound.stop();
}

//-----------------------------------------------
// Function to draw the LEVEL COMPLETE poster
//-----------------------------------------------

function levelCompletePoster()
{
	push();
	stroke(0, 206, 209, 200);
	fill(255,228,225,200);
	ellipse(width/5.5, height/2, 200, 200);
	stroke(127,255,212,200);
	fill(176, 224, 230, 200);
	ellipse(width/1.2,  height/2, 200, 200);
	stroke(199,21,133,150);
	fill(127,255,212,200);
	ellipse(1.9*width/3, 1.65*height/3, 370, 370);
	stroke(255,228,225,200);
	fill(0, 206, 209, 200);
	ellipse(width/3, 1.65*height/3, 300, 300);
	stroke(255,228,225,200);
	fill(199,21,133,150);
	ellipse(width/2, 1.75*height/3, 200, 200);
	stroke(0);
	fill(0);
	textSize(55);
	textFont(myFont[1]);
	textAlign(CENTER, CENTER);
	text("L E V E L  C O M P L E T E", width/2, height/2);
	textSize(48);
	text("Press space to continue", width/2, height/2 + 100);
	pop();
}