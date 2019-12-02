const fs = require('fs');
const path = require('path');

let self = module.exports = {
  getWorkingDirectory: () => {
    return process.cwd();
  },

  fileExists: (file) => {
    return fs.existsSync(file);
  },

  getDefaultConfigFile: ()=>{
    let configFile=self.getWorkingDirectory()+"/.squareci.";

    if (self.fileExists(configFile+"yaml")) {
        return configFile+"yaml";
    }else if(self.fileExists(configFile+"json")){
        return configFile+"json";
    }

    return null;
  },

  colorLog: (type, message)=>{
    const colors={
        reset:"\x1b[0m",
        error:"\x1b[31m",
        success:"\x1b[32m",
        logo:"\x1b[33m"
    }
    console.log(colors[type] + message + colors.reset);
  }
};