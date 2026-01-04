
// Minimal definitions
function hexToBytes(hex) {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

function bigintFromSignedBytesBE(bytes) {
    if (bytes.length === 0) return 0n;
    const negative = (bytes[0] & 0x80) !== 0;
    let result = 0n;
    if (negative) {
        const inverted = new Uint8Array(bytes.length);
        let carry = 1;
        for (let i = bytes.length - 1; i >= 0; i--) {
            const val = (~bytes[i] & 0xFF) + carry;
            inverted[i] = val & 0xFF;
            carry = val >> 8;
        }
        for (const b of inverted) {
            result = (result << 8n) | BigInt(b);
        }
        result = -result;
    } else {
        for (const b of bytes) {
            result = (result << 8n) | BigInt(b);
        }
    }
    return result;
}

function decodeY(yHex) {
    console.log("Decoding Y Hex (Length: " + yHex.length + ")");
    const bytes = hexToBytes(yHex);
    const view = new DataView(bytes.buffer);
    
    let cursor = 0;
    const aLen = view.getUint16(cursor, false);
    cursor += 2;
    console.log("A Length: " + aLen);
    
    const aBytes = bytes.slice(cursor, cursor + aLen);
    const a = bigintFromSignedBytesBE(aBytes);
    cursor += aLen;
    
    const bLen = view.getUint16(cursor, false);
    cursor += 2;
    console.log("B Length: " + bLen);
    
    const bBytes = bytes.slice(cursor, cursor + bLen);
    const b = bigintFromSignedBytesBE(bBytes);
    
    console.log("A: " + a.toString());
    console.log("B: " + b.toString());
    
    const expectedA = "6481282705453226987401092449274251947631816896626232370515319663285200916936020751246856233638957655384916997358742806507505624627924940316280020650202367834765803280058388196273427607930125705505054788424084292004327733949535316811794836123480059516882107771444245949325699295542942174247029830600899567437";
    const expectedB = "-4156416501370608727018418702673463762192453572913812220340979586041266575704506280369483714916844591384084903465443967869893808031666640690885567184970024600371643235613886294332948795399390436478581325282096299378123052726261159780512417770863654121352184502507536930943371893425907321794481122563235463719";
    
    if (a.toString() === expectedA) console.log("✅ A Matches Server Log");
    else console.error("❌ A Mismatch!\nExpected: " + expectedA + "\nGot:      " + a.toString());
    
    if (b.toString() === expectedB) console.log("✅ B Matches Server Log");
    else console.error("❌ B Mismatch!\nExpected: " + expectedB + "\nGot:      " + b.toString());
}

const yHex = "0080093aca88f74a7e6b769db3c9515cc2cd7dfe3841733b9ecebca9e014fa6827ebd22b11f5577826f6ca74dc7fdd65dc8d981c4ae6619275b182f4d88a693a1815fd9119c3b98eb3bd64c6e7490b4784f031c14d46b1e351bf1c523024584012e6aa8192fb0641102da33be7a0d8622a2d4d6cae2a890273c84cdffb01324a1f4d0080fa14c0c504028ef35878e78340bff0b93cbb84a5d766aa3e6ecb7dfe237ee4d5226e9d130b90f7dfe45e7caf29e155cff40fafc71ca36b50ec9ddb53b0a3e662739e387a3b381e7e58fb2833a7d7097bc3468362382f8829268e4242255335168ef588114c4910b3117d88cb814189d7db54f4990f7b739ac5d9f1acc724bdd9";
decodeY(yHex);
