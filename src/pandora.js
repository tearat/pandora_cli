const fs = require('fs');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const Cryptr = require('cryptr');

//////////////////////////////////////////////////

class Pandora{
    constructor(){
        this.db_name = null;
        this.endpoint = null;
        this.data = [];
        this.head = this.data;
        this.edit_state = null;
        this.save_state = false;
        this.key = null;
        this.unsaved = false;
        this.abort = false;
    }
    
    // Serving functions
    //
    find_by_name(name){
        let target = null;
        this.data.forEach(function(element, index) {
            if (element.name == name) {
                target = index;
            }
        });
        return target;
    }
    
    // Other functions
    //
    show_help(){
        console.log(`
\n [help|h] = this message \n\n 
[scan] = Scan directory for databases \n [choose|c ?] = Choose database \n\n
[r|read] = Read the current state (head) \n [list|l] = List of all records \n [save|s] = Save changes \n\n 
[add|new ?] = Add new item to DB \n [cd|o ?] = Open item \n [e ?] = Edit parameter \n [rm ?] = Remove parameter \n [del] = Delete item \n\n 
[key ?] = Set a crypto-key \n [enc] = Encrypt data \n [dec] = Decrypt data \n\n 
[quit|q|exit] = exit`);
    }
    
    // FS functions
    //
    scan_dir(){
        let files = fs.readdirSync('./src/data/');
        console.log("Files in directory:", files.join(', ')," \n" );
    }
    
    quit(){
        if (this.abort){
            console.log('cya');
            return true;
        }
    }
    
    // DB functions
    //
    show_list(){
        if (typeof this.data !== 'object'){
            console.log(`Can not show list in string mode. \n`);
            return false;
        }
        let list = [];
        this.data.forEach(function(element, index) {
            list.push(element.name);
        });
        console.log(list.join(", "));
    }
    
    return_to_root(){
        console.log(`/`);
        this.head = this.data;
    }
    
    read_state(){
        console.log(typeof this.data);
        if (this.head.name !== undefined){
            console.log(`/${ this.head.name }`);
        } else {
            console.log(`/`);
        }
        console.log(this.head);
    }
    
    choose_db(name){
        if (!this.unsaved){
            this.endpoint = `./src/data/${name}.json`;

            try {
                this.data = fs.readFileSync(this.endpoint, 'utf8');
                this.db_name = name;
            } catch(e) {
                console.log(`'${this.endpoint} is not exist. \n`);
                return false;
            }

            try {
                this.data = JSON.parse(this.data);
                console.log(`'${name}.json' successfully loaded. \n`);
                console.log(this.data);
            } catch(e) {
                console.log(`'${name}.json not valid or encrypted. \n`);
                console.log(this.data);
            }
            this.head = this.data;
            return true;
        } else {
            console.log("You have unsaved changes. Save it of discard before change database. \n")
            return false;
        }
    }
    
    save_db(){
        fs.writeFileSync(this.endpoint, JSON.stringify(this.data), function(err) {
            if (err) { return console.log(err); }
        }); 
        this.unsaved = false;
        console.log("The file was saved!\n");
    }
    
    discard_changes(){
        if (this.db_name != null){
            console.log("All changes discarded. \n");
            this.unsaved = false;
            this.choose_db(this.db_name);
            return true;
        }
    }
    
    save_changes_question(){
        if (this.unsaved){
            console.log("You have unsaved changes. Save it? [y/n]");
            this.save_state = true;
        } else {
            this.abort = true;
        }
    }
    
    save_changes(answer){
        if (this.save_state){
            if (answer == 'y'){
                this.unsaved = false;
                this.save_state = false;
                this.save_db();
                this.abort = true;
            }
            if (answer == 'n'){
                this.unsaved = false;
                this.save_state = false;
                this.abort = true;
            }
        }
    }
    
    // Encryption functions
    //
    set_key(key){
        this.key = new Cryptr(key); 
        console.log(`New crypto-key is ${key}  \n`);
    }
    
    encrypt(){
        if (this.key != null){
            if (typeof this.data === 'object'){
                this.data = JSON.stringify(this.data);
                console.log("Data stringified.")
                this.data = this.key.encrypt(this.data);
                console.log("Data encrypted:")
                this.head = this.data;
                console.log(this.data)
                this.unsaved = true;
            } else {
                console.log("Data is already encrypted.  \n");
            }
        } else {
            console.log("Key not specified.  \n")
        }
    }
    
    decrypt(){
        if (this.key != null){
            if (typeof this.data === 'string'){
                let backup = this.data;

                this.data = this.key.decrypt(this.data);
                console.log("Decrypted.")

                try {
                    this.data = JSON.parse(this.data);
                } catch(e) {
                    console.log("Decryption failed. Probably wrong key.  \n");
                    this.data = backup;
                    return false;
                }
                console.log("Data parsed:");
                console.log(this.data);
                this.head = this.data;
                this.unsaved = true;
            } else {
                console.log("Data is already decrypted.  \n");
            }
        } else {
            console.log("Key not specified.  \n")
        }
    }
    
    // Item functions
    //
    new_item(newdata){
        if (typeof this.data !== 'object'){
            console.log(`Can not create item in string mode.  \n`);
            return false;
        }
        if (this.find_by_name(newdata) == undefined){
            this.data.push({name: newdata});
            console.log(`New data: ${ newdata }`);
            console.log(`/${ newdata }`);
            this.head = this.data[this.find_by_name(newdata)];
            this.unsaved = true;
            return true;
        } else {
            console.log(`Name already exist.  \n`);
            return false;
        }
    }
    
    open_item(name){
        if (typeof this.data !== 'object'){
            console.log(`Can not open in string mode.  \n`);
            return false;
        }
        if (this.find_by_name(name) != undefined){
            this.head = this.data[this.find_by_name(name)];
            console.log(`/${ this.head.name }`);
        } else {
            console.log(`Not valid path.  \n`);
        }
    }
    
    edit_param_state(param){
        if (this.head.name !== undefined){
            this.edit_state = param;
            console.log(`Enter new '${param}'... (now is '${this.head[param]}')  \n`);
        } else {
            console.log('Select an item.  \n');
        }
    }
    
    edit_param(answer){
        if (this.edit_state != null){
            if (this.head.name !== undefined){
                this.head[this.edit_state] = answer;
                console.log(this.head);
                console.log(`${this.edit_state} changed to ${answer}  \n`);
                this.edit_state = null;
                this.unsaved = true;
                return true;
            } else {
                console.log('Cannot edit in root.  \n');
            }
        }
    }
    
    remove_param(param){
        if (this.head.name !== undefined){
            if (param != "name"){
                delete this.data[this.find_by_name(this.head.name)][param]; 
                console.log(`Parameter '${param}' removed from '${this.head.name}'`);
                this.unsaved = true;
            } else {
                console.log("'Name' is reserved parameter!  \n");
            }
        } else {
            console.log('Select an item.  \n');
        }
    }
    
    delete_item(target){
        if (typeof this.data !== 'object'){
            console.log(`Can not delete item in string mode.  \n`);
            return false;
        }
        if (this.head.name != target){
            if (this.find_by_name(target) != undefined){
                this.data.splice(this.find_by_name(target),1);
                console.log(`Item ${target} was deleted.  \n`);
                this.unsaved = true;
            }
        } else {
            console.log('You cannot delete item inside the item.  \n');
        }
    }
}

class Terminal{
    constructor(pandora){
        console.log("╔════════════════════════╗");
        console.log("║                        ║");
        console.log("║   Welcome to Pandora   ║");
        console.log("║                        ║");
        console.log("╚════════════════════════╝");
        console.log("");
        this.pandora = pandora;
        this.terminal();
    }
    
    terminal(){
        readline.question(`\n> `, (answer) => {

            // Check the state of editing item
            // If completed (and return true), terminal restarts
            if (this.pandora.edit_param(answer)){
                this.terminal();
                return false;
            }
            
            if (this.pandora.save_changes(answer)){
                this.terminal();
                return false;
            }
            
            if (this.pandora.quit()){
                readline.close();
                return false;
            }
            
            // Parser
            let parsed = answer.split(" ");
            
            // Parse two-word commands
            //
            if (parsed.length == 2){
                switch (parsed[0]){
                    case "choose":
                    case "c":
                        this.pandora.choose_db(parsed[1]);
                        this.terminal();
                        break;
                    case "key":
                        this.pandora.set_key(parsed[1]);
                        this.terminal();
                        break;
                    case "cd":
                    case "o":
                        this.pandora.open_item(parsed[1]);
                        this.terminal();
                        break;
                    case "add":
                    case "new":
                        this.pandora.new_item(parsed[1]);
                        this.terminal();
                        break;
                    case "e":
                        this.pandora.edit_param_state(parsed[1]);
                        this.terminal();
                        break;
                    case "rm":
                        this.pandora.remove_param(parsed[1]);
                        this.terminal();
                        break;
                    case "del":
                        this.pandora.delete_item(parsed[1]);
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
            if (parsed.length == 1){
                switch (answer){
                    case "cancel":
                    case "":
                        console.log('Cancel');
                        this.edit_state = null;
                        this.terminal();
                        break;
                    case "quit":
                    case "q":
                        this.pandora.save_changes_question();
                        this.terminal();
                        break;
                    case "fq":
                        readline.close();
                        break;
                    case "help":
                    case "h":
                        this.pandora.show_help();
                        this.terminal();
                        break;
                    case "scan":
                        this.pandora.scan_dir();
                        this.terminal();
                        break;
                    case "back":
                    case "b":
                        this.pandora.return_to_root();
                        this.terminal();
                        break;
                    case "save":
                    case "s":
                        this.pandora.save_db();
                        this.terminal();
                        break;
                    case "dis":
                        this.pandora.discard_changes();
                        this.terminal();
                        break;
                    case "read":
                    case "r":
                        this.pandora.read_state();
                        this.terminal();
                        break;
                    case "list":
                    case "l":
                        this.pandora.show_list()
                        this.terminal();
                        break;
                    case "enc":
                        this.pandora.encrypt();
                        this.terminal();
                        break;
                    case "dec":
                        this.pandora.decrypt();
                        this.terminal();
                        break;
                    default:
                        console.log("Undefined one-word command.");
                        this.terminal();
                }
            }
        })
    }
}

//////////////////////////////////////////////////

module.exports.Pandora = Pandora;
module.exports.Terminal = Terminal;