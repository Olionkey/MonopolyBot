const propertyCards = require('../persistant_data/MonopolyCards.json');
const updateJsonFile = require('update-json-file');
const roleFunction = require("./roles.js");


let lobbies = [];
const gameMap = ["Go", "MediterraneanAvenue", "CommunityChest", "BalticAvenue", "IncomeTax", "ReadingRailroad", "OrientalAvenue", "Chance", "VermontAvnue", "ConnecticutAvenue", "Jail", "St.CharlesPlace", "ElectricCompany", "StatesAvenue", "VirginiaAvenue", "PennsylvaniaRailroad", "St.JamesPlace", "CommunityChest", "TennesseeAvenue", "NewYorkAvenue", "FreeParking", "KentuckyAvenue", "Chance", "IndianaAvenue", "illinoisAvenue", "B&ORailroad", "AtlanticAvenue", "VentorAvenue", "WaterWorks", "MarvinGardens", "GoToJail", "PacificAvenue", "NorthCarolinaAvenue", "CommunityChest", "PennsylvaniaAvenue", "ShortLineRailroad", "Chance", "ParkPlace", "LuxuryTax", "Boardwalk"];

