// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract betting {

  // address public ownerAddr = 0xaE7DE0a0E7dD1a63C916fFd229F2501292B79643;

  struct Horse {
    uint id;
    string name;
  }

  struct Race {
    uint raceID;
    string winner; // The horse which win the race
    string result; // The bettor betting result (WIN/LOSE)
    uint bettedAmount; // The amount of money the bettor betted (in Wei)
  }

  struct Bettor {
    bool betted; // true when bettor has betted
    bool validated; //true when bettor has registered and passed verification process
    uint money; // The bettor current balance
    uint bettedID; // ID of the horse the bettor betted on
  }

  mapping(address => Bettor) public bettors;
  mapping(uint => Horse) public horses;
  mapping(uint => Race) public races;

  uint public horseCounter;
  uint public bettorCounter;
  uint public raceCounter;
  
  uint public winnerID;
  uint public prize;
  string public raceResult;

  constructor() {
    addHorse("Horse 1: Arabian");
    addHorse("Horse 2: England");
    addHorse("Horse 3: Ahalteke");
  }

  // Events
  event bettedEvent(uint indexed _horseId);
  event registrationSuccess(address _bettorAddr);

  // Error Checking
  modifier bettorMustNotExist(address _bettor) {
    require(!bettors[_bettor].validated,"bettor already registered");
    _;
  }

  modifier bettorMustExist(address _bettor) {
    require(bettors[_bettor].validated,"bettor registered in the system");
    _;
  }

  // Adding members
  function addHorse (string memory _name) private {
    horseCounter++;
    horses[horseCounter] = Horse(horseCounter,_name);
  }

  function registerBettor(address addr) public bettorMustNotExist(msg.sender) {
    bettorCounter++;
    bettors[addr] = Bettor(false, true, addr.balance, 0);

    emit registrationSuccess(addr);
  }

  function recordRace(string memory _winner, string memory _raceResult, uint _betAmount) public {
    raceCounter++;
    races[raceCounter] = Race(raceCounter, _winner, _raceResult, _betAmount);
  }

  
  //login
  function getBettor(address _bettor) public bettorMustExist(msg.sender) view returns(bool) {
    //check bettor is registered before
    if (_bettor == msg.sender && bettors[_bettor].validated) {
      return(true);
    } else {
      return(false);
    }
  }

  function depositContract() public payable{}

  function bet (uint _horseId) public payable {
    //require a registered and valid bettors
    require(bettors[msg.sender].validated);
    //require bettors haven't betted before
    require(!bettors[msg.sender].betted);
    //bet a valid horse
    require(_horseId > 0 && _horseId <= horseCounter);
    // require enough money to bet
    require(bettors[msg.sender].money >= msg.value);

    // Set the bet info
    bettors[msg.sender].betted = true;
    bettors[msg.sender].bettedID = _horseId;
    
    // randomize the winner
    winnerID = (block.timestamp % 3) + 1;

    // Check winner
    raceResult = "LOSE";
    if (bettors[msg.sender].bettedID == winnerID) { // win the bet
      prize = 5 * msg.value;
      payable(msg.sender).transfer(prize);
      raceResult = "WIN";
    }

    // Record the race history
    recordRace(horses[winnerID].name, raceResult, msg.value);

    // reset the bet status
    bettors[msg.sender].betted = false;
    bettors[msg.sender].bettedID = 0;
    bettors[msg.sender].money = msg.sender.balance;

    emit bettedEvent(_horseId);
  }
}
