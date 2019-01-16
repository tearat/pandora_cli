const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const Cryptr = require('cryptr');

//////////////////////////////////////////////////

class Pandora{
    constructor(endpoint){
        console.log("╔════════════════════════╗");
        console.log("║                        ║");
        console.log("║   Welcome to Pandora   ║");
        console.log("║                        ║");
        console.log("╚════════════════════════╝");
        this.data = fs.readFileSync(endpoint, 'utf8');
        try {
            this.data = JSON.parse(this.data);
            console.log("JSON file successfully loaded. \n");
            console.log(this.data);
        } catch(e) {
            console.log("JSON file not valid or encrypted. \n");
            console.log(this.data);
        }
        this.head = this.data;
        this.endpoint = endpoint;
        this.edit_state = null;
        this.key = null;
    }
    
    find_by_name(name){
        let target = null;
        this.data.forEach(function(element, index) {
            if (element.name == name) {
                target = index;
            }
        });
        return target;
    }
    
    terminal(){
        readline.question(`\n> `, (answer) => {

            if (this.edit_state != null){
                if (this.head.name !== undefined){
                    this.head[this.edit_state] = answer;
                    console.log(this.head);
                    this.edit_state = null;
                    console.log(`${this.edit_state} changed to ${answer}`);
                    this.terminal();
                } else {
                    console.log('Cannot edit in root.');
                }
            }

            let parsed = answer.split(" ");
            
            // Parse two-word commands
            //
            if (parsed.length == 2){
                switch (parsed[0]){
                    case "key":
                        console.log(`New crypto-key is ${parsed[1]}`);
                        this.key = new Cryptr(parsed[1]); 
                        this.terminal();
                        break;
                    case "cd":
                    case "o":
                        if (typeof this.data !== 'object'){
                            console.log(`Can not open in string mode.`);
                            this.terminal();
                            break;
                        }
                        let name = parsed[1];
                        if (this.find_by_name(name) != undefined){
                            this.head = this.data[this.find_by_name(name)];
                            console.log(`/${ this.head.name }`);
                        } else {
                            console.log(`Not valid path.`);
                        }
                        this.terminal();
                        break;
                    case "add":
                    case "new":
                        if (typeof this.data !== 'object'){
                            console.log(`Can not create item in string mode.`);
                            this.terminal();
                            break;
                        }
                        if (this.find_by_name(parsed[1]) == undefined){
                            this.data.push({name: parsed[1]});
                            console.log(`New data: ${ parsed[1] }`);
                        } else {
                            console.log(`Name already exist.`);
                        }
                        this.terminal();
                        break;
                    case "del":
                        if (typeof this.data !== 'object'){
                            console.log(`Can not delete item in string mode.`);
                            this.terminal();
                            break;
                        }
                        if (this.head.name != parsed[1]){
                            if (this.find_by_name(parsed[1]) != undefined){
                                let target = parsed[1];
                                this.data.splice(this.find_by_name(target),1);
                                console.log(`Item ${target} was deleted.`);
                            }
                        } else {
                            console.log('You cannot delete item inside the item.');
                        }
                        this.terminal();
                        break;
                    case "e":
                        if (this.head.name !== undefined){
                            let param = parsed[1];
                            this.edit_state = param;
                            console.log(`Enter new '${param}'... (now is '${this.head[param]}')`);
                        } else {
                            console.log('Select an item');
                        }
                        this.terminal();
                        break;
                    case "rm":
                        if (this.head.name !== undefined){
                            let param = parsed[1];
                            if (param != "name"){
                                delete this.data[this.find_by_name(this.head.name)][param]; 
                                console.log(`Parameter '${param}' removed from '${this.head.name}'`);
                            } else {
                                console.log("'Name' is reserved parameter!");
                            }
                        } else {
                            console.log('Select an item');
                        }
                        this.terminal();
                        break;
                    default:
                        console.log("Undefined two-word command.");
                        this.terminal();
                        break;
                }
            }

            // Parse one-word commands
            //
            switch (answer){
                case "help":
                case "h":
                    console.log(`\n [help|h] = this message \n\n [add|new ?] = Add new item to DB |n [cd|o ?] = Open item \n [e ?] = Edit parameter \n [rm ?] = Remove parameter \n [del] = Delete item \n\n [r|read] = read the current state(head) \n [list|l] = List of all records \n [save|s] = save changes \n\n [key ?] = set a crypto-key \n [enc] = Encrypt data \n [dec] = Decrypt data \n\n [quit|q|exit] = exit`);
                    this.terminal();
                    break;
                case "back":
                case "b":
                    console.log(`/`);
                    this.head = this.data;
                    this.terminal();
                    break;
                case "quit":
                case "q":
                    readline.close();
                    console.log('cya');
                    break;
                case "":
                    console.log('Cancel');
                    this.edit_state = null;
                    this.terminal();
                    break;
                case "save":
                case "s":
//                    let endpoint = this.endpoint;
                    fs.writeFileSync(this.endpoint, JSON.stringify(this.data), function(err) {
                        if (err) { return console.log(err); }
                    }); 
                    console.log("The file was saved!\n");
                    this.terminal();
                    break;
                case "read":
                case "r":
                    if (this.head.name !== undefined){
                        console.log(`/${ this.head.name }`);
                    } else {
                        console.log(`/`);
                    }
//                    console.log(typeof this.data);
                    console.log(this.head);
                    this.terminal();
                    break;
                case "list":
                case "l":
                    if (typeof this.data !== 'object'){
                        console.log(`Can not show list in string mode.`);
                        this.terminal();
                        break;
                    }
                    let list = [];
                    this.data.forEach(function(element, index) {
                        list.push(element.name);
                    });
                    console.log(list.join(", "));
                    this.terminal();
                    break;
                case "st":
                case "enc":
                    if (this.key != null){
                        if (typeof this.data === 'object'){
                            this.data = JSON.stringify(this.data);
                            console.log("Data stringified.")
                            this.data = this.key.encrypt(this.data);
                            console.log("Data encrypted:")
                            this.head = this.data;
                            console.log(this.data)
                        } else {
                            console.log("Data is already encrypted.");
                        }
                    } else {
                        console.log("Key not specified.")
                    }
                    this.terminal();
                    break;
                case "dec":
                    if (this.key != null){
                        if (typeof this.data === 'string'){
                            let backup = this.data;

                            this.data = this.key.decrypt(this.data);
                            console.log("Decrypted.")

                            try {
                                this.data = JSON.parse(this.data);
                            } catch(e) {
                                console.log("Decryption failed. Probably wrong key.");
                                this.data = backup;
                                this.terminal();
                                break;
                            }
                            console.log("Data parsed:");
                            console.log(this.data);
                            this.head = this.data;
                        } else {
                            console.log("Data is already decrypted.");
                        }
                    } else {
                        console.log("Key not specified.")
                    }
                    this.terminal();
                    break;
                default:
                    console.log("Undefined one-word command.");
                    this.terminal();
            }
        })
    }
}

//////////////////////////////////////////////////

module.exports.Pandora = Pandora;