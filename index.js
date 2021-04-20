function populateQueues(input) {
  const fIFOQueue = [];
  const rRQueue = [];
  const nPSJFQueue = [];

  input.forEach((process) => {
    const id = process[0];
    const runningTime = process[1] + process[3];
    const priority = process[2];
    const clockTime = process[4];
    switch (priority) {
      case 1:
        fIFOQueue.push({ id, runningTime, clockTime });
        break;
      case 2:
        rRQueue.push({ id, runningTime, clockTime });
        break;
      case 3:
        nPSJFQueue.push({ id, runningTime, clockTime });
        break;
    }
  });

  return {
    fIFOQueue,
    rRQueue,
    nPSJFQueue,
  };
}

function processFIFOQueue(queue, currentClockTime) {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
  }

  return processedQueue;
}

function processRRQueue(queue, currentClockTime) {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
  }

  return processedQueue;
}

function processNPSJFQueue(queue, currentClockTime) {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
  }

  return processedQueue;
}

function arrangeFIFOQueue(queue) {
  const tempQueue = [...queue];

  tempQueue.sort(function (process1, process2) {
    return process1.clockTime - process2.clockTime;
  });

  tempQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        tempQueue[index - 1].endTime,
        process.clockTime
      );
    }
    process.endTime = process.startTime + process.runningTime;
    process.waitingTime = process.startTime - process.clockTime;
    process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return tempQueue;
}

function arrangeRRQueue(queue, quantumTime) {
  let tempQueue = [...queue];
  let rRQueue = [];

  tempQueue.sort(function (process1, process2) {
    return process1.clockTime - process2.clockTime;
  });

  while (tempQueue.length !== 0) {
    rRQueue = rRQueue.concat(
      tempQueue.map((process) => {
        if (process.runningTime <= quantumTime) return process;

        return { ...process, runningTime: quantumTime };
      })
    );
    tempQueue = tempQueue.filter(
      (process) => process.runningTime > quantumTime
    );
    tempQueue = tempQueue.map((process) => ({
      ...process,
      runningTime: process.runningTime - quantumTime,
    }));
  }

  rRQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        rRQueue[index - 1].endTime,
        process.clockTime
      );
    }
    process.endTime = process.startTime + process.runningTime;
    // process.waitingTime = process.startTime - process.clockTime;
    // process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return rRQueue;
}

function arrangeNPSJFQueue(queue) {
  const tempQueue = [...queue];

  tempQueue.sort(function (process1, process2) {
    return process1.runningTime - process2.runningTime;
  });

  tempQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        tempQueue[index - 1].endTime,
        process.clockTime
      );
    }
    process.endTime = process.startTime + process.runningTime;
    process.waitingTime = process.startTime - process.clockTime;
    process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return tempQueue;
}

function main() {
  const QUANTUM_TIME = 5;

  let currentClockTime = 0;
  const input = [
    [1, 2, 1, 2, 2],
    [2, 5, 2, 5, 3],
    [3, 9, 1, 4, 3],
    [4, 3, 3, 6, 4],
  ];
  let { fIFOQueue, rRQueue, nPSJFQueue } = populateQueues(input);
  fIFOQueue = arrangeFIFOQueue(fIFOQueue);
  rRQueue = arrangeRRQueue(rRQueue, QUANTUM_TIME);
  nPSJFQueue = arrangeNPSJFQueue(nPSJFQueue);

  while (
    fIFOQueue.length !== 0 ||
    rRQueue.length !== 0 ||
    nPSJFQueue.length !== 0
  ) {
    fIFOQueue = processFIFOQueue(fIFOQueue, currentClockTime);
    rRQueue = processRRQueue(rRQueue, currentClockTime);
    nPSJFQueue = processNPSJFQueue(nPSJFQueue, currentClockTime);
    currentClockTime++;
  }

  console.log(input);
  console.log(fIFOQueue);
  console.log(rRQueue);
  console.log(nPSJFQueue);
}

main();
