/**

This file is part of Hunt the Yeti.

Hunt the Yeti is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var Direction = require('./Direction');
var RoomObjects = require('./RoomObjects');

/**
 * Creates the cave in which the player hunts the Yeti.
 * 
 * @precondition none
 * @postcondition the game board is initialized
                  with bats, pits, and Yeti.
 */
function Cave(rooms, width, height) {
    this.rooms = rooms;
    this.WIDTH = width;
    this.HEIGHT = height;

    if (-1 == this.find("Hunter")) {
        this.placeHunterInRandomSafeRoom();
    }
};

/**
 * Returns the cave height
 * 
 * @precondition none
 * @postcondition none
 * 
 * @return the cave height
 */
Cave.prototype.getHeight = function() {
    return this.HEIGHT;
};

/**
 * Returns the cave width
 * 
 * @precondition none
 * @postcondition none
 * 
 * @return the cave width
 */
Cave.prototype.getWidth = function() {
    return this.WIDTH;
};

/**
 * Counts the number of yeti in the cave.
 *
 * @precondition none
 * @postcondition none
 *
 * @return the number of yeti in the cave.
 */
Cave.prototype.getYetiCount = function() {
    var count = 0;
    for (var i = 0; i < this.rooms.length; i++) {
        if (-1 != this.rooms[i].indexOf("Yeti")) {
            count += 1;
        }
    }
    return count;
}

/**
 * Returns an ArrayList of objects in a room
 * 
 * @precondition a valid cell of a room
 * @postcondition none
 * 
 * @return an ArrayList of all objects in that room
 */
Cave.prototype.getRoomObjects = function(cell) {
    return this.rooms[cell];
};

/**
 * Returns an ArrayList of valid hunter moves
 * 
 * @precondition none
 * @postcondition none
 * 
 * @return an ArrayList of valid hunter moves, NORTH, SOUTH, etc.
 */
Cave.prototype.getHunterMoves = function(hunterCell) {
    var hunterRow = this.getRow(hunterCell);
    var hunterCol = this.getCol(hunterCell);

    var validHunterMoves = [];
    for (let aDirection of Direction.values) {
        var nextHunterCell = this.determineNextCell(aDirection, hunterRow, hunterCol);
        if (nextHunterCell != -1) {
            validHunterMoves.push(aDirection);
        }
    }

    return validHunterMoves;
};

/**
 * Based on the current game state, activates and returns the latest
 * consequence.
 * 
 * @precondition none
 * @postcondition if the consequence is "random_location", the hunter is
 *                moved to a random safe location. Otherwise, nothing
 *                changes (not even death changes the game).
 * 
 * @return a code of the latest consequence
 */
Cave.prototype.activateConsequence = function() {
    var hunterCell = this.find("Hunter");
    var consequence = this.getConsequence(hunterCell);

    if (consequence == "random_location") {
        this.transportHunterToRandomSafeRoom(hunterCell);
    }

    return consequence;
};

/**
 * Returns the cell id of a row or column (or -1 if not possible)
 * 
 * @precondition none
 * @postcondition none
 * 
 * @param row A cell row
 * @param col A cell column
 * @return returns the cell id of this row and column (or -1 if not
 *         possible)
 */
Cave.prototype.getCell = function (row, col) {
    if (row >= this.HEIGHT || row < 0 || col >= this.WIDTH || col < 0) {
        return -1;
    }
    return row * this.WIDTH + col;
};

/**
 * Returns the column of a cell (or -1 if not possible)
 * 
 * @precondition none
 * @postcondition none
 * 
 * @param cell
 *            a cell id
 * @return the column of this cell (or -1 if not possible)
 */
Cave.prototype.getCol = function(cell) {
    if (cell < 0 || cell >= this.rooms.length) {
        return -1;
    }
    return cell % this.WIDTH;
};

/**
 * Returns the row of a cell (or -1 if not possible)
 * 
 * @precondition none
 * @postcondition none
 * 
 * @param cell
 *            a cell id
 * @return the row of this cell (or -1 if not possible)
 */
Cave.prototype.getRow = function(cell) {
    if (cell < 0 || cell >= this.rooms.length) {
        return -1;
    }

    return Math.floor(cell / this.WIDTH);
};

/**
 * Launches a spear in a specified direction. The spear will either hit a 
 * Yeti (and returns true) or a wall (and returns false). It's up to the
 * game controller to decide if this is the end of the game.
 * 
 * @precondition aDirection is "NORTH", "SOUTH", "EAST", "WEST"
 * @postcondition the yeti (if hit) is removed from the cave
 * 
 * @param aDirection
 *            the direction in which the spear is thrown
 * @return true if a Yeti is hit, false otherwise
 */
Cave.prototype.launchSpear = function(aDirection) {
    var spearCell = this.find("Hunter");

    while (spearCell != -1) {
        var spearRow = this.getRow(spearCell);
        var spearCol = this.getCol(spearCell);
        spearCell = this.determineNextCell(aDirection, spearRow, spearCol);

        if (spearCell != -1) {
            var yetiPosition = this.rooms[spearCell].indexOf("Yeti");

            if (yetiPosition != -1) {
                var row = this.getRow(spearCell);
                var col = this.getCol(spearCell);
                this.removeItem(row, col, "Yeti");
                this.removeItem(row+1, col, "YetiSmell");
                this.removeItem(row-1, col, "YetiSmell");
                this.removeItem(row, col+1, "YetiSmell");
                this.removeItem(row, col-1, "YetiSmell");

                return true;
            }
        }
    }

    return false;
};

Cave.prototype.removeItem = function(row, col, item) {
    var cell = this.getCell(row, col);
    if (cell != -1) {
        var itemPosition = this.rooms[cell].indexOf(item);
        this.rooms[cell].splice(itemPosition, 1);
    }
};

/**
 * Moves the hunter in a specified direction
 * 
 * @param aDirection
 *            a direction (NORTH, SOUTH, EAST, WEST) to move.
 *
 * @precondition none
 * @postcondition If the hunter has the ability to move in the specified
 *                direction, the hunter moves 1 cell in that direction. If
 *                not, there is no postcondition.
 * 
 * @return true if the hunter moves, false otherwise.
 */
Cave.prototype.moveHunter = function(aDirection) {
    var hunterCell = this.find("Hunter");
    var hunterPosition = this.rooms[hunterCell].indexOf("Hunter");
    var hunterRow = this.getRow(hunterCell);
    var hunterCol = this.getCol(hunterCell);
    var nextHunterCell = this.determineNextCell(aDirection, hunterRow, hunterCol);

    if (nextHunterCell != -1) {
        this.moveObjectToCell(hunterCell, hunterPosition, nextHunterCell);
    }

    return nextHunterCell != -1;
};

// Private methods from here down.

Cave.prototype.determineNextCell = function(aDirection, row, col) {
    var nextCell = -1;
    if (aDirection === Direction.NORTH) {
        nextCell = this.getCell(row - 1, col);
    }

    if (aDirection === Direction.SOUTH) {
        nextCell = this.getCell(row + 1, col);
    }

    if (aDirection === Direction.WEST) {
        nextCell = this.getCell(row, col - 1);
    }

    if (aDirection === Direction.EAST) {
        nextCell = this.getCell(row, col + 1);
    }
    return nextCell;
};

Cave.prototype.find = function(toFind) {
    var room = -1;

    for (var i = 0; i < this.rooms.length; i++) {
        var position = this.rooms[i].indexOf(toFind);
        if (position != -1) {
            room = i;
        }
    }

    return room;
};

Cave.prototype.getConsequence = function(hunterCell) {
    for (var j = 0; j < this.rooms[hunterCell].length; j++) { 
        var aRoomObject = this.rooms[hunterCell][j];
        if (RoomObjects[aRoomObject].consequence != "") {
            return RoomObjects[aRoomObject].consequence;
        }
    }

    return "";
};

Cave.prototype.getRandomSafeRoom = function(safeRooms) {
    return safeRooms[Math.floor(Math.random() * safeRooms.length)];
};

Cave.prototype.moveObjectToCell = function(inCell, inPosition, nextCell) {
    var item = this.rooms[inCell].splice(inPosition, 1);
    this.rooms[nextCell].push(item[0]);
};

Cave.prototype.getSafeRooms = function() {
    var safeRooms = [];
    for (var i = 0; i < this.rooms.length; i++) {
        if (this.rooms[i].length == 0) {
            safeRooms.push(i);
        }
    }
    return safeRooms;
};

Cave.prototype.transportHunterToRandomSafeRoom = function(hunterCell) {
    var hunterPosition = this.rooms[hunterCell].indexOf("Hunter");
    var safeRooms = this.getSafeRooms();
    var safeRoom = this.getRandomSafeRoom(safeRooms);

    this.moveObjectToCell(hunterCell, hunterPosition, safeRoom);
};

Cave.prototype.placeHunterInRandomSafeRoom = function() {
    var safeRooms = this.getSafeRooms();
    var safeRoom = this.getRandomSafeRoom(safeRooms);
    this.rooms[safeRoom].push("Hunter");
};

module.exports = Cave;
