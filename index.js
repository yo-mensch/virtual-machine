const fs = require('fs');
var converter = require('hex2dec');
const charToAscii = require('char-to-ascii');

var regs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var counter = 0;
var flag = false;
var isFinished = false;
var arrBinChunk = '';
var commandArray = [];
var inputData = '';
var quote = '';

function chunk(s, maxBytes) {
    //! https://nodejs.org/api/buffer.html#buffer_buf_slice_start_end
    /*
      buf.slice([start[, end]])
      start <integer> Where the new Buffer will start. Default: 0.
      end <integer> Where the new Buffer will end (not inclusive). Default: buf.length.
      Returns: <Buffer>
    */
    let buf = Buffer.from(s);
    let readBuffer = true
    let startChunkByte = 0
    let commandLine;
    let endChunkByte = maxBytes
    while (readBuffer) {
        // First round
        startChunkByte === 0 ? endChunkByte = startChunkByte + maxBytes : ""
        //Handle last chunk
        endChunkByte >= buf.length ? readBuffer = false : ""

        // addr: the position of the first bytes.  raw: the chunk of x bytes
        commandLine = buf.slice(startChunkByte, endChunkByte).toString('hex');

        startChunkByte = endChunkByte
        endChunkByte = startChunkByte + maxBytes
    }
    return commandLine;
}

//nuskaito input faila
fs.readFile('q1_encr.txt', 'utf8', (err, data) => {
    if (err) throw err;
    inputData = data;
});

//nuskaito binary faila
fs.readFile('decryptor.bin', (err, data) => {
    if (err) throw err;
    arrBinChunk = chunk(data, 1024);
});

setTimeout(function partOne() {
    var inputDataIndex = 0;
    var rx, ry;
    //visas veiksmas bus cia, nes async does its thing;
    for (var i = 0; i < arrBinChunk.length; i++) {
        if (i === 0 || i % 2 === 0) {
            commandArray.push(arrBinChunk.substring(i, i + 2));
        }
    }
    //Ry pirmas charas, Rx antras charas
    for (var i = 0; i < commandArray.length; i += 2) {
        switch (commandArray[i]) {
            case "01": //rx++
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                regs[rx]++;
                counter += 2;
                break;

            case "02": //rx--
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                regs[rx]--;
                counter += 2;
                break;

            case "03": //mov 
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                ry = converter.hexToDec(commandArray[i + 1][0], { prefix: false });
                regs[rx] = regs[ry];
                counter += 2;
                break;

            case "04": //regs[0]=dec(parametras)
                regs[0] = converter.hexToDec(commandArray[i + 1], { prefix: false });
                counter += 2;
                break;

            case "05": // << shift
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var shift = regs[rx] << 1;
                regs[rx] = shift;
                counter += 2;
                break;

            case "06": // >> shift
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var shift = regs[rx] >> 1;
                regs[rx] = shift;
                counter += 2;
                break;

            ////////////////// jumps
            case "07": // jump
                var par = converter.hexToDec(commandArray[i + 1], { prefix: false });
                par = parseInt(par);
                counter += par;
                if (counter >= 256) { counter -= 256; }
                i = counter - 2;
                break;

            case "08":
                if (flag) {
                    var par = converter.hexToDec(commandArray[i + 1], { prefix: false });
                    par = parseInt(par);
                    counter = counter + par;
                    i = counter - 2;
                }
                break;

            case "09":
                if (!flag) {
                    var par = converter.hexToDec(commandArray[i + 1], { prefix: false });
                    par = parseInt(par);
                    if (counter + par >= 256) counter = counter + par - 256;
                    else counter = counter + par;
                    i = counter - 2;
                }
                break;

            case "0a":
                if (inputDataIndex === inputData.length - 1) {
                    var par = converter.hexToDec(commandArray[i + 1], { prefix: false });
                    par = parseInt(par);
                    if (counter + par >= 256) counter = counter + par - 256;
                    else counter = counter + par;
                    i = counter - 2;
                }
                break;

            ////////////// nebe jumps
            case "0b":
                isFinished = true;
                break;

            case "0c":
                ry = converter.hexToDec(commandArray[i + 1][0], { prefix: false });
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var result = regs[rx] + regs[ry];
                regs[rx] = result;
                counter += 2;
                break;

            case "0d":
                ry = converter.hexToDec(commandArray[i + 1][0], { prefix: false });
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var result = regs[rx] - regs[ry];
                regs[rx] = result;
                counter += 2;
                break;

            case "0e":
                ry = converter.hexToDec(commandArray[i + 1][0], { prefix: false });
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var result = (regs[rx] ^ regs[ry]);
                regs[rx] = result;
                counter += 2;
                break;

            case "0f":
                ry = converter.hexToDec(commandArray[i + 1][0], { prefix: false });
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var result = (regs[rx] | regs[ry]);
                regs[rx] = result;
                counter += 2;
                break;

            case "10":
                if (inputDataIndex === inputData.length) {
                    isFinished = true;
                }
                else if (inputDataIndex === inputData.length - 1) {
                    rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                    var res = charToAscii(inputData[inputDataIndex]);
                    inputDataIndex++;
                    regs[rx] = res;
                    flag = true;
                }
                else {
                    rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                    var res = charToAscii(inputData[inputDataIndex]);
                    regs[rx] = res;
                    inputDataIndex++;
                }
                counter += 2;
                break;

            case "11":
                rx = converter.hexToDec(commandArray[i + 1][1], { prefix: false });
                var res = String.fromCharCode(regs[rx]);
                quote += res;
                fs.writeFile('output.txt', quote, (err, data) => {
                    if (err) console.log(err);
                });
                counter += 2;
                break;
        }
        if (isFinished) {
            console.log("check 'output.txt' file");
            break;
        }
    }
}, 1000);