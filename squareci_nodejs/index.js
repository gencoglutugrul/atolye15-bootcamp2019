#!/usr/bin/env node

const yargs = require("yargs");
const ora = require('ora');
const squareci = require("./libSquareci");
const fs = require("fs");
const child_process = require('child_process');
const parallel = require("./loadProcess");
const bbPromise = require('bluebird');
const ConfigurationInterface = require("./Configuration");

const squareciLogo=`
 ____________________________________________________
|                                    _____ _____     |
|                                   / ____|_   _|    |
|  ___  __ _ _   _  __ _ _ __ ___  | |      | |      |
| / __|/ _\` | | | |/ _\` | '__/ _ \\ | |      | |      |  
| \\__ \\ (_| | |_| | (_| | | |  __/ | |____ _| |_     | 
| |___/\\__, |\\__,_|\\__,_|_|  \\___|  \\_____|_____|    |
|         | |                                        |
|         |_|                                        |
|____________________________________________________|\n`;


squareci.colorLog("logo",squareciLogo);

const defaultOptions={
    "config"    : squareci.getDefaultConfigFile(),
    "path"      : squareci.getWorkingDirectory()
};

let options = yargs
 .usage("Usage: [-c <file> -p <path>]")
 .option("c", { alias: "config", describe: "configuration file", type: "string"})
 .option("p", { alias: "path", describe: "working path for docker", type: "string" })
 .argv;

for(defaultOption in defaultOptions){
    if(!options[defaultOption]){
        options[defaultOption]=defaultOptions[defaultOption];
    }
}

if(options.config==null){
    squareci.colorLog(
        "error",
        "Error: Please enter the configuration file or create .squareci.yaml/.squareci.json"+
        " in working directory!"
    );
    process.exit();
}else{
    // pek de interface olmadı :(
    const configuration=ConfigurationInterface.loadConfigurationFile(options.config);
    
    const spinnerRunningContainer = ora({
        text: 'Running Up Container'
    }).start();
    const spinnerMounting = ora({
        text: 'Mounting working path as a volume'
    }).start();
    
    // create image and mount it to given path
    // proje anladığım kadarıyla bu kodla proje dizinini mount ediyoruz.
    // proje dizinini bilinmediğinden direk docker root dizinini mount ediyorum.
    const runDockerCommand = `docker run -it --volume ${options.path}:/ ${configuration.image}`;
    const createDockerImageProcess = child_process.spawnSync(runDockerCommand);
    
    if (createDockerImageProcess.error) {
        // if docker does not work then
        // the others can't work.
        // it's not depend on configuration.exitOnFailure
        spinnerRunningContainer.fail();
        spinnerMounting.fail();
        process.exit();
    }else{
        //docker ready
        spinnerRunningContainer.succeed();
        spinnerMounting.succeed();

        /*
            Yine anladığım kadarıyla bizim steps, before, after için yazdığımız komutlar 
            docker içerisinde proje dizininde bash üzerinden çalıştırılmalı.
        */
        const spinnerRunningBefore = ora({
            text: 'Running before stage'
        }).start();
        const spinnerRunningSteps = ora({
            text: 'Running steps'
        });
        
        const spinnerRunningAfter = ora({
            text: 'Running after stage'
        });

        if(configuration.runInParallel){
            // run before stage
            // bu kısım berbat bir çözüm oldu :(
            // yapılması gereken bu paralel çalıştırma kısmını daha çok modülerleştirmek
            // 3 defa benzer kodu tekrar ettim 
          let taskBinding = task => {
              // docker containerımızda istediğimiz taskları çalıştırmak için
              // container içerisindeki bash'e komut gönderiyoruz.
            task.run = dockerRunCommand + " bash " + task.run;
            return parallel.loadProcess.bind(null, task, configuration.exitOnFailure);
          };
          let taskMapper = (command,index) => {
            return command();
          };

          let commands = configuration.before.map(taskBinding);
        
          return bbPromise.map(commands, taskMapper)
          .error(() => {
            spinnerRunningBefore.fail();
            if(configuration.exitOnFailure)
                process.exit();
          })
          .then(() => {
            spinnerRunningBefore.succeed();
          }).finally(() => {
            // run steps
            spinnerRunningSteps.start();
            let stepsCommands = configuration.steps.map(taskBinding);

            return bbPromise.map(stepsCommands, taskMapper)
            .error(() => {
                spinnerRunningSteps.fail();
                if(configuration.exitOnFailure)
                    process.exit();
            })
            .then(() => {
                spinnerRunningSteps.succeed();
            })
            .finally(() => {
                // run after
                spinnerRunningAfter.start();
                let afterCommands = configuration.after.map(taskBinding);

                return bbPromise.map(afterCommands, taskMapper)
                .error(() => {
                    spinnerRunningAfter.fail();
                    if(configuration.exitOnFailure)
                        process.exit();
                })
                .then(() => {
                    spinnerRunningAfter.succeed();
                });
            });
          });

        }else{
            // configuration.runInParallel: false
            const taskFunction = task => {
                let spinnerSingleTask = ora({
                    text:task.name
                });
                task.run = dockerRunCommand + " bash " + task.run;
                let child_process=child_process.spawnSync(task.run);
                if(child_process.error){
                    spinnerSingleTask.fail();
                    if(configuration.exitOnFailure)
                        process.exit();
                }else{
                    spinnerSingleTask.succeed();
                }
            };

            configuration.before.map(taskFunction);
            spinnerRunningBefore.succeed();

            configuration.steps.map(taskFunction);
            spinnerRunningSteps.succeed();
            
            configuration.after.map(taskFunction);
            spinnerRunningAfter.succeed();
            
        }    
    }
}