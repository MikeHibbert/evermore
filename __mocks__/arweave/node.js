exports.init = function(config) {
    return {
        createTransaction: (data) => {
            return Promise.resolve({
                id: "1234567890abcdefghijklm",
                data: data,
                tags: [],
                signature: null,
                addTag: function(name, value) {
                    this.tags.push({
                        name: name, 
                        value: value,
                        get: function(key) {
                            return this[key];
                        }
                    });
                },
                get: function(key) {
                    return this[key];
                }
            })
        },

        transactions: {
            sign: (transaction, jwk) => {
                transaction.signature = "1234567890abcdefghijklm";
            },
            getUploader: (transaction) => {
                return Promise.resolve({
                    id: 1,
                    chunks: [1, 2, 3],
                    transaction: transaction,
                    isComplete: false,
                    chunkIndex: 0,
                    uploadChunk: function() {
                        console.log("Uploading chunks...");

                        this.chunkIndex++;

                        if(this.chunkIndex == this.chunks.length - 1) {
                            this.isComplete = true;
                        }
                        
                        return Promise.resolve("OK");
                    }
                });
            },
            getPrice: (size) => {
                return Promise.resolve("123456781234");
            },
            post: (transaction) => {
                return Promise.resolve(transaction);
            },
            get: (tx_id) => {
                const tx = JSON.parse('{"format":2,"id":"RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao","last_tx":"FaSqcNmZDAFRycZ48l4Q6KwMeNMVwXkJGV9qg8lwp5Xsb2Bjiu2aBMfUJ4Yi1Z21","owner":"t3G4NQ2IyRbi3wic3pN3mkSiYY1y9OKPdOyITbZMex-GxdiE4wEdNxl7FFfzzvT-WEkpROmSAZztwD7gF5XeCVRwsIdd7Uw7VLF4xUsw59VPOt2hpDY24uiLajOdCEJDuSbnH_lrevfVwNvwheJEVtc-0bo1CMjlgYuqGY6F8WXJTy2m_vG_DNbYaiN_WYTnYubbSHV7d4cCN8Bzjb33kncMHC-IjEcV8ov08QmSmKk1oZ1ejTkQhHmSTm9a1aI-t0-KhDzJagJI9AXWHVjoGi7ellentZWJhfpy3lBPVm0RM_TE5TNGZ9K5nC5rgw_JHVhU63LOsHzSvdQSsZnidN0etDl4OyPjGoogZfhVkHHwyP570SVCxCeTbuvQyFn7z5Ksd86YFG2ENNsWoVeEY8qW7WFT8LUGAyuIawr1y0ksxv6AXGZi_wIo6R9D2n0G67NteTPOpGjahVcVbx2A7T8ehZ_3IoeXjzAHJbgYv0RrCigu_2Yb5T7GmswnoghY-q77zHmk8hH7nOtXH6QDOO-vJDvXIXNglUT7NmgvPtmf03vuMbpw5A0HoKDvo2UehDoneAjpNBTWmApdHcfVJtHm19nqiathGy9WY9uzXoF-4JQISlMvSuI9gtuDSNPqov0PNnd6hxyGh_1bIX9Qe9igj0s7TKII9fdgTsSCXvE","tags":[{"name":"QXBw","value":"RXZlcm1vcmVEYXRhc3RvcmU"},{"name":"cGF0aA","value":"XERlc2t0b3AuaW5p"},{"name":"bW9kaWZpZWQ","value":"MTU5NjUyMzk3MDI4MQ"},{"name":"aG9zdG5hbWU","value":"REVTS1RPUC0yNlZNTzNG"}],"target":"","quantity":"0","data":"","data_size":"212","data_tree":[],"data_root":"6fvgr14dnYM3BAgpwjRUeMDAVYrSOu8lICmLJ55EuwQ","reward":"515006","signature":"RRyUlwQU1ZkjVw02AWRky2WC5Tp6hppr0lfu2ve8QrAcIb59IT8hPEV-7tmjl_eqffaXU4MgyAtcPuPgUvo6LkM7oHH_4uKiSzZvjJ35XO6tjjjzBCI3_29sBoTb77RN-sD-EtvWNnr0UGwZ3v3Jcsu4kVJ6Arf756QMlNqCmoIeSoCT4zvJ0GI1zOBfLHL5W4vM3yIfcQODgTxmyYZPG2RYaiaFsliI6jUIX2eXG6gojUtZIr_K9nms2A_73PKD3CG6j3gzsdw-VVizccrE5aVajZWBWqdUJRSW182ocN5FXGs3WHYdZDcZpNo6Lj7Fy1voyU2JfoGW5k4XQL-aJMRXGazj3FiZ51-GZOlv1TLhQZZjimCXybGaH65x-utWSDy6BuY0E8g4oGA_Mtinkumx7jWjZH-l-3LQalTKC1b0411Ju6_8mgN0tAzt6muH1okrkR7KyNl8TlLcs0hNfgr3cTqOJ5U2eGavfct2hHaFfgfS2OKJLFl1CcIxzWDpYxlvqIW3zKJUUPv7_10sy0ALrf57lVtOYA7qTPs7boznVCdVRKz0FS1QHS0Dbe4Xy6qJZHL4YUppI9dz1qKCCBwheD6cbYCVIGP5tLJkXvjwunkWvcXKQx_wDut0Vj7c2pAmXjEzV9EjWvHjdapArNl8OT0SUQvRpRytnAfl89A"}');
                
                tx['get'] = function(key) {
                    return this[key];
                }

                for(let i in tx.tags) {
                    const tag = tx.tags[i];
                    tag['get'] = function(key) {
                        return this[key];
                    }
                }

                return Promise.resolve(tx);
            }
        },
    
        wallets: {
            jwkToAddress: (jwk) => {
                return Promise.resolve("1234567890abcdefghijklm");
            },
            getBalance: (address) => {
                if(address == "1234567890_Zero_Balance_Address") {
                    return Promise.resolve("0");
                } 
    
                return Promise.resolve("123456789");
            },
            winstonToAr: (winston) => {
                if(winston == "0") {
                    return Promise.resolve(0);
                }
    
                return Promise.resolve(1.0);
            }
        },

        arql: (query) => {
            return Promise.resolve([
                "RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao",
                "RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao",
                "RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao",
                "RZZfLBu2VlnkZgMRYq9XqtJoS2iyRfLWKiTQp4QMjao"
            ])
        }
    }
}    
