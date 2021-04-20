const log = [];
const queueLog = [];
let currentClockTime = 0;

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
    log.push({
      clockTime: currentClockTime,
      message: `Selesai memproses proses ${processedProcess.id}`,
    });
  } else if (processedProcess.startTime < currentClockTime) {
    log.push({
      clockTime: currentClockTime,
      message: `Sedang memproses proses ${processedProcess.id}`,
    });
  }

  return processedQueue;
}

function processRRQueue(queue, currentClockTime) {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
    log.push({
      clockTime: currentClockTime,
      message: `Selesai memproses proses ${processedProcess.id} dengan indeks ${processedProcess.index}`,
    });
  } else if (processedProcess.startTime < currentClockTime) {
    log.push({
      clockTime: currentClockTime,
      message: `Sedang memproses proses ${processedProcess.id} dengan indeks ${processedProcess.index}`,
    });
  }

  return processedQueue;
}

function processNPSJFQueue(queue, currentClockTime) {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
    log.push({
      clockTime: currentClockTime,
      message: `Selesai memproses proses ${processedProcess.id}`,
    });
  } else if (processedProcess.startTime < currentClockTime) {
    log.push({
      clockTime: currentClockTime,
      message: `Sedang memproses proses ${processedProcess.id}`,
    });
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
        const lastIndex =
          rRQueue.reverse().find((element) => element.id === process.id) !==
          undefined
            ? rRQueue.reverse().find((element) => element.id === process.id)
                .index
            : -1;

        return {
          ...process,
          runningTime:
            process.runningTime <= quantumTime
              ? process.runningTime
              : quantumTime,
          index: lastIndex + 1,
        };
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
    // process.waitingTime = process.startTime - process.clockTime; (cari selisih antara tiap process index + waiting time mula2)
    // process.turnAroundTime = process.waitingTime + process.runningTime; (endtime - clocktime dri tiap process id)
  });

  rRQueue.forEach((process, index) => {
    // process.waitingTime = process.startTime - process.clockTime; (cari selisih antara tiap process index + waiting time mula2)
    // process.turnAroundTime = process.waitingTime + process.runningTime; (endtime - clocktime dri tiap process id)
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

  const input = [
    ["A", 2, 1, 2, 2],
    ["B", 5, 2, 5, 3],
    ["C", 9, 1, 4, 3],
    ["D", 3, 3, 6, 4],
  ];
  let { fIFOQueue, rRQueue, nPSJFQueue } = populateQueues(input);

  if (fIFOQueue.length > 50) {
    const tempQueue = [...fIFOQueue].sort(function (process1, process2) {
      return process2.runningTime - process1.runningTime;
    });

    fIFOQueue = tempQueue.slice(0, 50);
    rRQueue = rRQueue.concat(
      tempQueue.slice(50).map((process) => {
        log.push({
          clockTime: currentClockTime,
          message: `Proses ${process.id} didemosikan ke Qb karena Qa penuh`,
        });
        return process;
      })
    );
  }

  fIFOQueue = arrangeFIFOQueue(fIFOQueue);
  rRQueue = arrangeRRQueue(rRQueue, QUANTUM_TIME);
  nPSJFQueue = arrangeNPSJFQueue(nPSJFQueue);

  while (
    fIFOQueue.length !== 0 ||
    rRQueue.length !== 0 ||
    nPSJFQueue.length !== 0
  ) {
    fIFOQueue = processFIFOQueue(fIFOQueue, currentClockTime);

    if (fIFOQueue.length > 0) {
      const fIFOQueueCurrentProcess = fIFOQueue[0];
      if (currentClockTime - fIFOQueueCurrentProcess.startTime === 20) {
        nPSJFQueue.push({
          ...fIFOQueueCurrentProcess,
          runningTime: fIFOQueueCurrentProcess.runningTime - 20,
          clockTime: currentClockTime,
        });
        fIFOQueue.shift();
        fIFOQueue = arrangeFIFOQueue(fIFOQueue);
        nPSJFQueue = arrangeNPSJFQueue(nPSJFQueue);

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${fIFOQueueCurrentProcess.id} didemosikan ke Qc karena telah menggunakan CPU selama 20 clock`,
        });
      }
    }

    rRQueue = processRRQueue(rRQueue, currentClockTime);

    if (rRQueue.length > 0) {
      const rRQueueCurrentProcess = rRQueue[0];
      if (rRQueueCurrentProcess.index === 3) {
        const remainingRunningTime = rRQueue
          .filter((process) => process.id === rRQueueCurrentProcess.id)
          .reduce(
            (accumulator, currentValue) =>
              accumulator + currentValue.runningTime,
            0
          );

        nPSJFQueue.push({
          ...rRQueueCurrentProcess,
          runningTime: remainingRunningTime,
          clockTime: currentClockTime,
        });
        rRQueue = rRQueue.filter(
          (process) =>
            process.id !== rRQueueCurrentProcess.id &&
            rRQueueCurrentProcess.index >= 3
        );
        nPSJFQueue = arrangeNPSJFQueue(nPSJFQueue);
        rRQueue = arrangeRRQueue(rRQueue);

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${rRQueueCurrentProcess.id} didemosikan ke Qc karena telah menggunakan siklus RR selama 3 kali`,
        });
      }
    }

    nPSJFQueue = processNPSJFQueue(nPSJFQueue, currentClockTime);

    if (
      currentClockTime === 40 &&
      nPSJFQueue.length > 0 &&
      nPSJFQueueCurrentProcess.waitingTime >= 40
    ) {
      const nPSJFQueueCurrentProcess = nPSJFQueue[0];
      if (nPSJFQueueCurrentProcess.waitingTime >= 40) {
        fIFOQueue.push({
          ...nPSJFQueueCurrentProcess,
          clockTime: currentClockTime,
        });
        nPSJFQueue.shift();
        fIFOQueue = arrangeFIFOQueue(fIFOQueue);
        nPSJFQueue = arrangeNPSJFQueue(nPSJFQueue);

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${nPSJFQueueCurrentProcess.id} dipromosikan ke Qa karena telah menunggu selama 40 clock`,
        });
      }
    }

    queueLog.push({
      clockTime: currentClockTime,
      fIFOQueue,
      rRQueue,
      nPSJFQueue,
    });

    currentClockTime++;
  }

  console.log(input);
  queueLog.forEach((element) => console.log(element));
}

main();

currentClockTime--;
let clockCounter = 0;
$(document).ready(() => {
  $("#clock-text").text(`Clock ${clockCounter}`);
  $("#prev-btn").prop("disabled", true);

  renderQueues();
  renderLog();
});

function nextClock() {
  $("#clock-text").text(`Clock ${++clockCounter}`);

  if (clockCounter === currentClockTime) $("#next-btn").prop("disabled", true);

  $("#prev-btn").prop("disabled", false);

  renderQueues();
  renderLog();
}

function prevClock() {
  $("#clock-text").text(`Clock ${--clockCounter}`);

  if (clockCounter === 0) {
    $("#prev-btn").prop("disabled", true);
  }

  $("#next-btn").prop("disabled", false);

  renderQueues();
  renderLog();
}

function renderQueues() {
  $("#fifo-queue").empty();
  $("#rr-queue").empty();
  $("#npsjf-queue").empty();

  queueLog
    .find((element) => element.clockTime === clockCounter)
    .fIFOQueue.forEach((process) => {
      let rowStructure =
        process.startTime < clockCounter
          ? "<tr class='table-success'>"
          : "<tr>";
      rowStructure += `<th class='text-center'>${process.id}</th>`;
      rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
      rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
      rowStructure += "</tr>";
      $("#fifo-queue").append(rowStructure);
    });

  queueLog
    .find((element) => element.clockTime === clockCounter)
    .rRQueue.forEach((process) => {
      let rowStructure =
        process.startTime < clockCounter
          ? "<tr class='table-success'>"
          : "<tr>";
      rowStructure += `<th class='text-center'>${process.id}</th>`;
      rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
      rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
      rowStructure += `<td class='text-center'>${process.index}</td>`;
      rowStructure += "</tr>";
      $("#rr-queue").append(rowStructure);
    });

  queueLog
    .find((element) => element.clockTime === clockCounter)
    .nPSJFQueue.forEach((process) => {
      let rowStructure =
        process.startTime < clockCounter
          ? "<tr class='table-success'>"
          : "<tr>";
      rowStructure += `<th class='text-center'>${process.id}</th>`;
      rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
      rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
      rowStructure += "</tr>";
      $("#npsjf-queue").append(rowStructure);
    });
}

function renderLog() {
  $("#log").empty();
  log
    .filter((element) => element.clockTime === clockCounter)
    .forEach((element) =>
      $("#log").append(
        $(`<li class='list-group-item'></li>`).text(element.message)
      )
    );
}
