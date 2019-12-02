const bbPromise = require('bluebird');
const ora = require('ora');
const spawn = require('child_process').spawn;

module.exports = {
  loadProcess: (task,exitOnFailure)=> {
    return new bbPromise(function(resolve, reject) {
        const spinner=ora({
            text: task.name
        }).start();

        let child_process = spawn(task.run);

        child_process.stderr.on('data', function(err) {
            if(exitOnFailure)
                process.exit();
            spinner.fail();
            reject(err.toString());
        });

        child_process.on('exit', ()=>{
            spinner.succeed();
            resolve();
        });

    });
  }
}