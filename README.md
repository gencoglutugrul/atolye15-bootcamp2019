# atolye15-bootcamp2019

In 2019, when I was a first-year student, I tried to fulfill the task given at the Intern Bootcamp, organized by Atolye15, but I wasn't very successful. I didn't have much idea about Docker, asynchronous programming, or how to write test cases. I learned a lot in the last three years and decided to try to complete this task again. You can find the original task below.

# Development Process

I looked up the old code base and I ask myself "How could I've done this mess?". I read carefully the instructions again. I started with the structure. I knew I should use typescript but I could not sure about folder structure. I checked up some of the big cli projects made with nodejs for example yarn, npm, etc. I decided to use what I generally see in that projects. The structure can be seen below.

```
+ /bin
  - /squareci.ts
+ /lib
+ /tests
```

As for the argument parsing, I knew that my old choice (yargs package) is enough for this job. I just implemented it as a ts module.

After I've gotten args successfully I've needed to parse the config file and check if it fits in the schema. I chose `joi` package for this job. Also, I chose the `yaml` package to read yaml files. And I implemented it as a config module.

So the simple steps were completed and I needed to decide about using one container for all tasks or using one container for each task. If the first option is good enough I had to choose it for better performance. I researched and tested whether it is possible to run multiple commands at the same time in a running Docker container. I've seen it's possible and go with one container for all tasks. And I started to implement. When I checked my old codebase to see how I implemented docker cases I've seen there was a command injection vulnerability although I love cyber security. I knew it's not a big issue to have command injection vulnerability in this kind of application. But I fixed it using the execFile method. And I implemented a couple of Docker methods to run/stop/remove etc. containers.

After all of that, I needed to implement some methods to handle parallel and serial processing. I've written some methods but after I found `Listr` package it became unnecessary.

When everything was ready I could've implemented the main process. I needed a spinner for cli. I just checked well-known projects again. And what I've seen is that every project implemented their `console-reporter` for showing task states and progress. I decided to implement my own `console-reporter` but I thought it can be over-engineering. So I checked for a lot of spinner packages. I couldn't find anything close to the example gif. So I decided to go with my old choice `ora` package. After implementations, I figured out some bugs in the package. I tried to dig it out but I've felt that I moved away from my main goal. So I started to research again and I found the same package used in the example which is the `listr` package. I also noticed that `listr` have built-in support for parallel processing. This was cool because I didn't need to implement parallel or serial processing stuff.

# SquareCI

Source: https://gist.github.com/alpcanaydin/05955ef6c84517d9762b68bb7e8072cf

It is a command tool that runs given steps on given docker image.

```
Usage: squareci [options]

Options:

  -c, --config  Config file to read. It can be a valid yml or json file.
                It it is not provided command tries to read .squareci.yml file or
                .squareci.json file in current working directory. If none of them
                have been provided then it raises an error.

  -p, --path    Current working dir. The folder that mounted to the docker
                container. If it is not provided then cwd is used.
```

## Configuration File Syntax

### YAML Notation: `.squareci.yaml`

```yml
image: node:latest

runInParallel: true
exitOnFailure: true

before:
  - name: Build
    run: yarn build

steps:
  - name: Lint
    run: yarn lint

  - name: Format Check
    run: yarn format:check

  - name: Unit Tests
    run: yarn test

after:
  - name: Notify!
    run: echo 'Everything is done'
```

### JSON Notation: `.squareci.json`

```json
{
  "image": "node:latest",
  "runInParallel": true,
  "exitOnFailure": true,
  "before": [{ "name": "Build", "run": "yarn build" }],
  "steps": [
    { "name": "Lint", "run": "yarn lint" },
    { "name": "Format Check", "run": "Format Check" },
    { "name": "Unit Tests", "run": "yarn test" }
  ],
  "after": [{ "name": "Notify", "run": "echo 'everything is done'" }]
}
```

## Config Specifications

### image `string`,

Docker image name. You can find more detailed info from [here](https://docs.docker.com/v17.09/engine/userguide/storagedriver/imagesandcontainers/).

### runInParallel `boolean`, Default: `false`

Whether `steps` can be run in parallel. If it is true then **steps stage** are executed in parallel mode. Otherwise, squareci will run them step by step.

### exitOnFailure `boolean`, Default: `true`

If it is set to `true` then program stops on first failure regardless it is in parallel mode or not. Otherwise it runs all steps even there is an error in a step.

### before `Array<Task>`

All tasks in here runs right before `steps` execution. If it is an error on this stage, command doesn't run `steps`.

### steps `Array<Task>`

Tasks to run in docker container.

### after `Array<Task>`

All tasks in here runs right after `steps` execution.

## Determination of success

If the given task returns `stderr` then it is failed. If there is no error then it can be assumed as succeeded.

## Example Output

![Example](https://user-images.githubusercontent.com/1801024/69721616-49095800-1126-11ea-9dd5-4509b3ffebfe.gif)
