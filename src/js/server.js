import express from 'express'
import tools from './tools.cjs'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import Web3 from 'web3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const app = express();

// const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use('/static',express.static('src'));
app.use(cookieParser());

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(request,response) {
    response.render('pages/registration');
});

app.post('/registration', async (request, response) => {
    var addr = request.body.address;
    var pwd = request.body.password;
    try {
        let tx = await RC.methods.registerBettor(addr).send({
            from: addr,
            gas: 1000000
        })
        console.log(tx);
        response.send("<p id='accountAddress'>Successfully Registered: "+addr+"</p>");
    } catch(err) {
        console.log(err);
    }
});

app.get('/login',function(request,response) {
    response.render('pages/login', {

    });
});

app.post('/auth', async (request, response) => {
    var addr = request.body.address;
    var pwd = request.body.password;

    try {
        RC.methods.getBettor(addr).call({from: addr}).then(function(res) {
            console.log(res);
            if(res == true) {
                response.cookie('addr', addr);
                response.redirect('/betting');
            } else {
                response.send();
            }
        });
    } catch(err) {
        console.log(err);
    }
});

app.get('/betting', async (request, response)=> {
    let horseCounter = await RC.methods.horseCounter.call().call();
    let raceCounter = await RC.methods.raceCounter.call().call();
    var _addr = request.cookies.addr;

    var contractAddress = "0x95442F2C53ef36407ae191d27d8a0346a9329906";
    var _contractBalance = 0;
    var ownerAddress = "0xaE7DE0a0E7dD1a63C916fFd229F2501292B79643";
    var _ownerBalance = 0;

    web3.eth.getBalance(contractAddress, (error, balance) => {
        if (error) {
            console.error('Error:', error);
        } else {
            _contractBalance = web3.utils.fromWei(balance, 'ether');
        }
    });

    web3.eth.getBalance(ownerAddress, (error, balance) => {
        if (error) {
            console.error('Error:', error);
        } else {
            _ownerBalance = web3.utils.fromWei(balance, 'ether');
            // Deposit balance to the contract from owner
            if (balance > 90000000000000000000) {
                RC.methods.depositContract().send({
                    from: ownerAddress,
                    gas: 1000000,
                    value: 90000000000000000000
                })
                console.log("deposited")
            }
        }
      });
        
    // Get horses
    var _horseObj = [];
    for(let i=1; i <= horseCounter; i++) {
        let _horses = await RC.methods.horses(i).call();
        _horseObj[i-1] = {id:_horses['id'],name:_horses['name']};
    }

    // Get Races History
    var _raceObj = [];
    for(let i=1; i <= raceCounter; i++) {
        let _races = await RC.methods.races(i).call();
        _raceObj[i-1] = {raceID:_races['raceID'],winner:_races['winner'],result:_races['result'],
        bettedAmount:web3.utils.fromWei(_races['bettedAmount'], "ether")};
    }

    // Get bettors
    let _bettor = await RC.methods.bettors(_addr).call();
    
    response.render('pages/betting', {
        horseList:_horseObj,
        addr: _addr,
        money: web3.utils.fromWei(_bettor.money, "ether"),
        raceList: _raceObj,
        ownerBalance: _ownerBalance,
        contractBalance: _contractBalance
    });
});

app.post('/bet', async function (request, response) {
    console.log(request.body);
    var horseId = request.body.horseSelect;
    var addr = request.body.accountAddress;
    var betMoney = request.body.bettedMoney;
    try {
        let tx = await RC.methods.bet(horseId).send({
            from: addr,
            gas: 1000000,
            value: betMoney
        })
        console.log(tx);
        response.redirect('/betting');
    } catch(err) {
        console.log(err);
    }
});

app.listen(3000, async(request, response) => {
    console.log("Currently listening");
});
