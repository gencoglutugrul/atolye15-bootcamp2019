const fs = require("fs");
const path = require('path');
const YAML = require('yaml')

class ConfigurationChecker{
    constructor(data){
        if(typeof data.image != "string"){
            throw new Error("Error: please add image(string) parameter to configuration!");
        }
        
        if(typeof data.runInParallel != "boolean"){
            // default false
            data.runInParallel=false;
        }
        
        if(typeof data.exitOnFailure != "boolean"){
            // default true
            data.runInParallel=true;
        }
        
        if(!Array.isArray(data.before))
            throw new Error("Error: please add before (task array) parameter to configuration!");
        
        if(!Array.isArray(data.steps))
            throw new Error("Error: please add steps (task array) parameter to configuration!");
        
        if(!Array.isArray(data.after))
            throw new Error("Error: please add after (task array) parameter to configuration!");
        
        
        this.checkTasks(data.before);
        this.checkTasks(data.steps);
        this.checkTasks(data.after);

        this.data=data;
    }

    checkTasks(taskArray){
        taskArray.map((item) => {
            if(typeof item.name != "string")
                throw new Error("Error: please add name (string) parameter to task array!");
                
            if(typeof item.run != "string")
                throw new Error("Error: please add run (string) parameter to task array!");
        })
    }

    getConfigurations(){
        return this.data;
    }
}
module.exports = {
    loadConfigurationFile: (file)=> {
        let configuration;
        let fileContent = fs.readFileSync(file);
        if(path.extname(file) == ".json")
            configuration = JSON.parse(fileContent);
        else if(path.extname(file) == ".yaml")
            configuration = YAML.parse(fileContent);
        else
            throw new Error('Error: please select yaml or json file!');
        
        let configurationChecker = new ConfigurationChecker(configuration);
        return configurationChecker.getConfigurations();
    }
}