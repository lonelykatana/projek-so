const QUANTUM_TIME = 5;

const onFileChange = (event) => {
  const selectedFile = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    const result = event.target.result;
    const input = [];

    result.split("\n").forEach((line) => {
      const words = line.split(" ");

      if (words.length === 5) {
        input.push(
          words.map((word, index) => (index === 0 ? word : parseInt(word)))
        );
      }
    });

    const { currentClockTime, queueLog, log } = main(input);

    let clockCounter = 0;

    $("#clock-text").text(`Clock ${clockCounter}`);

    $("#prev-btn").prop("disabled", true);
    if (currentClockTime === 0) {
      $("#next-btn").prop("disabled", true);
    } else {
      $("#next-btn").prop("disabled", false);
    }

    $("#next-btn").click(() => {
      clockCounter++;
      $("#clock-text").text(`Clock ${clockCounter}`);

      if (clockCounter === currentClockTime)
        $("#next-btn").prop("disabled", true);

      $("#prev-btn").prop("disabled", false);

      render(clockCounter, queueLog, log);
    });

    $("#prev-btn").click(() => {
      clockCounter--;
      $("#clock-text").text(`Clock ${clockCounter}`);

      if (clockCounter === 0) {
        $("#prev-btn").prop("disabled", true);
      }

      $("#next-btn").prop("disabled", false);

      render(clockCounter, queueLog, log);
    });

    render(clockCounter, queueLog, log);
  };

  reader.readAsText(selectedFile);
};

const main = (input) => {
  const queueLog = [];
  const log = [];
  let currentClockTime = 0;
  let { fIFOQueue, rRQueue, nPSJFQueue } = populateQueues(input, (changesLog) =>
    log.push(changesLog)
  );

  fIFOQueue = initializeFIFOQueue(fIFOQueue);
  rRQueue = initializeRRQueue(rRQueue);
  nPSJFQueue = initializeNPSJFQueue(nPSJFQueue);

  while (
    fIFOQueue.length !== 0 ||
    rRQueue.length !== 0 ||
    nPSJFQueue.length !== 0
  ) {
    fIFOQueue = processQueue(fIFOQueue, currentClockTime, (changesLog) =>
      log.push(changesLog)
    );

    rRQueue = processQueue(rRQueue, currentClockTime, (changesLog) =>
      log.push(changesLog)
    );

    nPSJFQueue = processQueue(nPSJFQueue, currentClockTime, (changesLog) =>
      log.push(changesLog)
    );

    if (fIFOQueue.length > 0) {
      const fIFOQueueCurrentProcess = fIFOQueue[0];
      if (currentClockTime - fIFOQueueCurrentProcess.startTime + 1 >= 20) {
        const newNPSJFProcess = {
          ...fIFOQueueCurrentProcess,
          runningTime: fIFOQueueCurrentProcess.runningTime - 20,
          clockTime: currentClockTime,
          startTime: Math.max(
            nPSJFQueue[nPSJFQueue.length - 1].endTime,
            currentClockTime
          ),
        };
        newNPSJFProcess.endTime =
          newNPSJFProcess.startTime + newNPSJFProcess.runningTime;
        newNPSJFProcess.waitingTime =
          newNPSJFProcess.startTime - newNPSJFProcess.clockTime;
        newNPSJFProcess.turnAroundTime =
          newNPSJFProcess.waitingTime + newNPSJFProcess.runningTime;

        nPSJFQueue.push(newNPSJFProcess);
        fIFOQueue.shift();

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${fIFOQueueCurrentProcess.id} didemosikan ke Qc karena telah menggunakan CPU selama 20 clock`,
        });
      }
    }

    if (rRQueue.length > 0) {
      const rRQueueCurrentProcess = rRQueue[0];
      if (rRQueueCurrentProcess.index + 1 >= 3) {
        const remainingRunningTime = rRQueue
          .filter((process) => process.id === rRQueueCurrentProcess.id)
          .reduce(
            (accumulator, currentValue) =>
              accumulator + currentValue.runningTime,
            0
          );

        const newNPSJFProcess = {
          ...rRQueueCurrentProcess,
          runningTime: remainingRunningTime,
          clockTime: currentClockTime,
          index: null,
          startTime: Math.max(
            nPSJFQueue[nPSJFQueue.length - 1].endTime,
            currentClockTime
          ),
        };
        newNPSJFProcess.endTime =
          newNPSJFProcess.startTime + newNPSJFProcess.runningTime;
        newNPSJFProcess.waitingTime =
          newNPSJFProcess.startTime - newNPSJFProcess.clockTime;
        newNPSJFProcess.turnAroundTime =
          newNPSJFProcess.waitingTime + newNPSJFProcess.runningTime;

        nPSJFQueue.push(newNPSJFProcess);
        rRQueue = rRQueue.filter(
          (process) => process.id !== rRQueueCurrentProcess.id
        );

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${rRQueueCurrentProcess.id} didemosikan ke Qc karena telah menggunakan siklus RR selama 3 kali`,
        });
      }
    }

    if (currentClockTime + 1 >= 40 && nPSJFQueue.length > 0) {
      const filteredNPSJFQueue = nPSJFQueue.filter(
        (process) => currentClockTime - process.clockTime + 1 >= 40
      );

      filteredNPSJFQueue.forEach((process) => {
        const newFIFOProcess = {
          ...process,
          clockTime: currentClockTime,
          startTime: Math.max(
            fIFOQueue[fIFOQueue.length - 1].endTime,
            currentClockTime
          ),
        };

        newFIFOProcess.endTime =
          newFIFOProcess.startTime + newFIFOProcess.runningTime;
        newFIFOProcess.waitingTime =
          newFIFOProcess.startTime - newFIFOProcess.clockTime;
        newFIFOProcess.turnAroundTime =
          newFIFOProcess.waitingTime + newFIFOProcess.runningTime;

        fIFOQueue.push(newFIFOProcess);
        if (fIFOQueue.length > 50) {
          const process = [...fIFOQueue].sort((process1, process2) => {
            return process1.runningTime - process2.runningTime;
          })[0];

          addLog({
            clockTime: currentClockTime,
            message: `Proses ${process.id} didemosikan ke Qb karena Qa penuh`,
          });

          for (
            let index = 0;
            index < Math.ceil(process.runningTime / QUANTUM_TIME);
            index++
          ) {
            const newRRProcess = {
              ...process,
              index,
              clockTime: currentClockTime,
              runningTime: Math.min(
                process.runningTime - QUANTUM_TIME * index,
                QUANTUM_TIME
              ),
            };

            newRRProcess.startTime = Math.max(
              rRQueue[rRQueue.length - 1].endTime + 1,
              newRRProcess.clockTime
            );

            newRRProcess.endTime =
              newRRProcess.startTime + newRRProcess.runningTime;

            if (index === 0) {
              newRRProcess.waitingTime =
                newRRProcess.startTime - newRRProcess.clockTime;
            } else {
              newRRProcess.waitingTime =
                newRRProcess.startTime - rRQueue[rRQueue.length - 1].endTime;
            }

            newRRProcess.turnAroundTime =
              newRRProcess.waitingTime + newRRProcess.runningTime;

            rRQueue.push(newRRProcess);
          }
        }
        nPSJFQueue.shift();

        log.push({
          clockTime: currentClockTime,
          message: `Proses ${process.id} dipromosikan ke Qa karena telah menunggu selama 40 clock`,
        });
      });
    }

    queueLog.push({
      clockTime: currentClockTime,
      fIFOQueue,
      rRQueue,
      nPSJFQueue,
      fIFOAwt:
        fIFOQueue.reduce((sum, process) => sum + process.waitingTime, 0) /
        fIFOQueue.length,
      rRAwt:
        rRQueue.reduce((sum, process) => sum + process.waitingTime, 0) /
        [...new Set(rRQueue.map((process) => process.id))].length,
      nPSJFAwt:
        nPSJFQueue.reduce((sum, process) => sum + process.waitingTime, 0) /
        nPSJFQueue.length,
      fIFOAtt:
        fIFOQueue.reduce((sum, process) => sum + process.turnAroundTime, 0) /
        fIFOQueue.length,
      rRAtt:
        rRQueue.reduce((sum, process) => sum + process.turnAroundTime, 0) /
        [...new Set(rRQueue.map((process) => process.id))].length,
      nPSJFAtt:
        nPSJFQueue.reduce((sum, process) => sum + process.turnAroundTime, 0) /
        nPSJFQueue.length,
    });

    currentClockTime++;
  }

  currentClockTime--;
  return { queueLog, currentClockTime, log };
};

const populateQueues = (input, addLog) => {
  let fIFOQueue = [];
  let rRQueue = [];
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

  // Pendemosian jika jumlah proses pada antrian FIFO melebihi 50
  if (fIFOQueue.length > 50) {
    const tempQueue = [...fIFOQueue].sort((process1, process2) => {
      return process2.runningTime - process1.runningTime;
    });

    fIFOQueue = tempQueue.slice(0, 50);
    rRQueue = rRQueue.concat(
      tempQueue.slice(50).map((process) => {
        addLog({
          clockTime: currentClockTime,
          message: `Proses ${process.id} didemosikan ke Qb karena Qa penuh`,
        });
        return process;
      })
    );
  }

  return {
    fIFOQueue,
    rRQueue,
    nPSJFQueue,
  };
};

const initializeFIFOQueue = (queue) => {
  const fIFOQueue = [...queue];

  fIFOQueue.sort((process1, process2) => {
    return process1.clockTime - process2.clockTime;
  });

  fIFOQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        fIFOQueue[index - 1].endTime + 1,
        process.clockTime
      );
    }
    process.endTime = process.startTime + process.runningTime;
    process.waitingTime = process.startTime - process.clockTime;
    process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return fIFOQueue;
};

const initializeRRQueue = (queue) => {
  let tempQueue = [...queue];
  let rRQueue = [];

  tempQueue.sort((process1, process2) => {
    return process1.clockTime - process2.clockTime;
  });

  while (tempQueue.length !== 0) {
    rRQueue = rRQueue.concat(
      tempQueue.map((process) => {
        const foundElement = rRQueue
          .reverse()
          .find((element) => element.id === process.id);
        let lastIndex = -1;
        if (foundElement != null) {
          lastIndex = foundElement.index;
        }

        return {
          ...process,
          runningTime: Math.min(process.runningTime, QUANTUM_TIME),
          index: lastIndex + 1,
        };
      })
    );
    tempQueue = tempQueue
      .filter((process) => process.runningTime > QUANTUM_TIME)
      .map((process) => ({
        ...process,
        runningTime: process.runningTime - QUANTUM_TIME,
      }));
  }

  rRQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        rRQueue[index - 1].endTime + 1,
        process.clockTime
      );
    }

    process.endTime = process.startTime + process.runningTime;

    if (process.index === 0) {
      process.waitingTime = process.startTime - process.clockTime;
    } else {
      process.waitingTime =
        process.startTime -
        rRQueue.find(
          (element) =>
            element.id === process.id && element.index === process.index - 1
        ).endTime;
    }

    process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return rRQueue;
};

const initializeNPSJFQueue = (queue) => {
  const nPSJFQueue = [...queue];

  nPSJFQueue.sort((process1, process2) => {
    return process1.runningTime - process2.runningTime;
  });

  nPSJFQueue.forEach((process, index) => {
    if (index === 0) {
      process.startTime = process.clockTime;
    } else {
      process.startTime = Math.max(
        nPSJFQueue[index - 1].endTime + 1,
        process.clockTime
      );
    }
    process.endTime = process.startTime + process.runningTime;
    process.waitingTime = process.startTime - process.clockTime;
    process.turnAroundTime = process.waitingTime + process.runningTime;
  });

  return nPSJFQueue;
};

const processQueue = (queue, currentClockTime, addLog) => {
  if (queue.length === 0) return queue;

  const processedQueue = [...queue];
  const processedProcess = processedQueue[0];

  if (processedProcess.endTime === currentClockTime) {
    processedQueue.shift();
    addLog({
      clockTime: currentClockTime,
      message: `Selesai memproses proses ${processedProcess.id} ${
        processedProcess.index != null
          ? ` dengan indeks ${processedProcess.index}`
          : ""
      }`,
    });
  } else if (processedProcess.startTime <= currentClockTime) {
    addLog({
      clockTime: currentClockTime,
      message: `Sedang memproses proses ${processedProcess.id}`,
    });
  }

  return processedQueue;
};

const render = (clockCounter, queueLog, log) => {
  $("#fifo-queue").empty();
  $("#rr-queue").empty();
  $("#npsjf-queue").empty();
  $("#log").empty();

  const foundQueueLog = queueLog.find(
    (element) => element.clockTime === clockCounter
  );

  foundQueueLog.fIFOQueue.forEach((process) => {
    let rowStructure =
      process.startTime <= clockCounter ? "<tr class='table-success'>" : "<tr>";
    rowStructure += `<th class='text-center'>${process.id}</th>`;
    rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
    rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
    rowStructure += `<td class='text-center'>${process.startTime}</td>`;
    rowStructure += `<td class='text-center'>${process.endTime}</td>`;
    rowStructure += `<td class='text-center'>${process.waitingTime}</td>`;
    rowStructure += `<td class='text-center'>${process.turnAroundTime}</td>`;
    rowStructure += "</tr>";
    $("#fifo-queue").append(rowStructure);
  });

  if (foundQueueLog.fIFOQueue.length > 0) {
    $("#fifo-awt").text(
      `Average waiting time: ${
        queueLog.find((element) => element.clockTime === clockCounter).fIFOAwt
      }`
    );
    $("#fifo-att").text(
      `Average turnaround time: ${
        queueLog.find((element) => element.clockTime === clockCounter).fIFOAtt
      }`
    );
  } else {
    $("#fifo-awt").empty();
    $("#fifo-att").empty();
  }

  foundQueueLog.rRQueue.forEach((process) => {
    let rowStructure =
      process.startTime <= clockCounter ? "<tr class='table-success'>" : "<tr>";
    rowStructure += `<th class='text-center'>${process.id}</th>`;
    rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
    rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
    rowStructure += `<td class='text-center'>${process.index}</td>`;
    rowStructure += `<td class='text-center'>${process.startTime}</td>`;
    rowStructure += `<td class='text-center'>${process.endTime}</td>`;
    rowStructure += `<td class='text-center'>${process.waitingTime}</td>`;
    rowStructure += `<td class='text-center'>${process.turnAroundTime}</td>`;
    rowStructure += "</tr>";
    $("#rr-queue").append(rowStructure);
  });

  if (foundQueueLog.rRQueue.length > 0) {
    $("#rr-awt").text(
      `Average waiting time: ${
        queueLog.find((element) => element.clockTime === clockCounter).rRAwt
      }`
    );
    $("#rr-att").text(
      `Average turnaround time: ${
        queueLog.find((element) => element.clockTime === clockCounter).rRAtt
      }`
    );
  } else {
    $("#rr-awt").empty();
    $("#rr-att").empty();
  }

  foundQueueLog.nPSJFQueue.forEach((process) => {
    let rowStructure =
      process.startTime <= clockCounter ? "<tr class='table-success'>" : "<tr>";
    rowStructure += `<th class='text-center'>${process.id}</th>`;
    rowStructure += `<td class='text-center'>${process.runningTime}</td>`;
    rowStructure += `<td class='text-center'>${process.clockTime}</td>`;
    rowStructure += `<td class='text-center'>${process.startTime}</td>`;
    rowStructure += `<td class='text-center'>${process.endTime}</td>`;
    rowStructure += `<td class='text-center'>${process.waitingTime}</td>`;
    rowStructure += `<td class='text-center'>${process.turnAroundTime}</td>`;
    rowStructure += "</tr>";
    $("#npsjf-queue").append(rowStructure);
  });

  if (foundQueueLog.nPSJFQueue.length > 0) {
    $("#npsjf-awt").text(
      `Average waiting time: ${
        queueLog.find((element) => element.clockTime === clockCounter).nPSJFAwt
      }`
    );
    $("#npsjf-att").text(
      `Average turnaround time: ${
        queueLog.find((element) => element.clockTime === clockCounter).nPSJFAtt
      }`
    );
  } else {
    $("#npsjf-awt").empty();
    $("#npsjf-att").empty();
  }

  log
    .filter((element) => element.clockTime === clockCounter)
    .forEach((element) =>
      $("#log").append(
        $(`<li class='list-group-item'></li>`).text(element.message)
      )
    );
};
