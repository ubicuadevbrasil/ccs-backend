// START API ROUTES //

app.post('/api/v1/whatsapp_session', function (req, res, next) {
    console.log(req.body.data)

    var data = req.body.data

    let query = "SELECT a.mobile, a.name, a.cnpj, a.email, a.telefone, b.* FROM tab_filain AS a LEFT JOIN tab_logs AS b ON a.sessionBot = b.sessionid WHERE b.sessionid = ? AND b.stread != 2 ORDER BY b.dt";
    let params = [data.chat_session_id]
    dbcc.query(query, params, (err, result) => {
        if (err) return next(err)
        if (result.length > 0) {
            result[0].transbordo = (result[0].status == 1) ? true : false
            res.status(200).json(result)
        } else {
            let query = "SELECT a.mobile, a.name, a.cnpj, a.telefone, a.transfer, b.* FROM tab_atendein a LEFT JOIN tab_logs AS b ON a.sessionBot = b.sessionid WHERE b.sessionid = ? AND b.stread != 2 ORDER BY b.dt"
            let params = [data.chat_session_id]
            dbcc.query(query, params, (err, result) => {
                if (err) return next(err)
                if (result.length > 0) {
                    result[0].transbordo = true
                    res.status(200).json(result)
                } else {
                    res.status(200).json([])
                }
            })
        }
    })
})

app.post('/api/v1/send_media_ccs', function (req, res, next) {
    try {
        var payload = req.body.filetx
        log("Nova Media Enviada", payload);
        var _sessionBot = payload.session;
        var _cnpj = payload.cnpj
        var _name = payload.name
        var _type = getWebChatType(payload.type);
        var _hashfile = payload.hashfile;
        var _descfile = payload.descfile;
        var _base64 = payload.myMedia;
        var _urlbox = false;
        var _origem = "chatweb"
        dbcc.query("SELECT uuid() as UUID;", async function (err, id) {
            var _custom_uid = id[0].UUID;
            dbcc.query("SELECT * FROM tab_atendein WHERE sessionBot=? LIMIT 1", [_sessionBot], function (err, result) {
                if (err) return next(err)
                if (result.length > 0) {
                    // Armazenando Log da Conversa
                    var _id = _custom_uid;
                    var _sessionid = result[0].sessionBot;
                    var _fromid = result[0].fkto;
                    var _fromname = result[0].fkname;
                    var _toid = result[0].mobile;
                    var _toname = result[0].name;
                    var _msgdir = "i";
                    var _msgtype = _type;
                    var _msgurl = cdn + _hashfile;
                    var _msgcaption = "";
                    dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgurl, msgcaption, origem) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [_id, _sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgurl, _msgcaption, _origem], function (err, result) {
                        if (err) return next(err)
                        log("Novo Registro LOG Inserido", _id);
                        res.status(200).json({ "hashfile": _hashfile, "descfile": _descfile, "type": _type })
                    });
                } else {
                    var _id = _custom_uid;
                    var _sessionid = _sessionBot;
                    var _fromid = _cnpj;
                    var _fromname = _name;
                    var _toid = "491b9564-2d79-11ea-978f-2e728ce88125";
                    var _toname = "BOT";
                    var _msgdir = "i";
                    var _msgtype = _type;
                    var _msgurl = cdn + _hashfile;
                    var _msgcaption = "";

                    dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgurl, msgcaption, origem) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [_id, _sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgurl, _msgcaption, _origem], function (err, result) {
                        if (err) return next(err)
                        log("Novo Registro LOG Inserido", _id);
                        res.status(200).json({ "hashfile": _hashfile, "descfile": _descfile, "type": _type })
                    });
                }
            });
        });
    } catch (err) {
        return next(err)
    }
})

app.post('/api/v1/input_excel_ccs', async function (req, res, next) {
    try {
        var payload = req.body.filetx
        console.log("Novo input excel", payload);

        if (typeof payload == "string") {
            payload = JSON.parse(payload)
        }

        var regx = new RegExp("[^0-9]", "g");

        var _sessionBot = payload.session;
        var _cnpj = payload.cnpj
        var _name = payload.name
        var _telefone = payload.telefone
        var _type = getWebChatType(payload.type);
        var _hashfile = payload.hashfile;
        var _descfile = payload.descfile;
        var _origem = payload.origem
        var _file = cdn + _hashfile
        var tempfile = await downloadFile(_file)

        var workbook = XLSX.readFile(tempfile.path); // ./assets is where your relative path directory where excel file is, if your excuting js file and excel file in same directory just igore that part
        var sheet_name_list = workbook.SheetNames; // SheetNames is an ordered list of the sheets in the workbook
        var sheet_cnpj = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); //if you have multiple sheets
        var sheet_wholesaler = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[1]]); //if you have multiple sheets
        var data = await parseArray(sheet_cnpj)
        var data2 = await parseArray(sheet_wholesaler)
        var { wholesalers, not_found } = await parseDistribuidor(data, data2)
        _cnpj = data[0]["cnpj do pdv"]
        _cnpj = String(_cnpj).replace(regx, "")

        var order = {
            "id": uuidv4(),
            "cnpj": _cnpj,
            "produtos": data.filter(prod => prod.unidades),
            "distribuidores": wholesalers
        }

        if (order.distribuidores.length > 0 && not_found.length <= 0) {
            dbcc.query("INSERT INTO tab_input_excel(id, sessionid, cnpj, `name`, telefone, `file`, `filedata`, origem) VALUES(?,?,?,?,?,?,?,?)", [order.id, _sessionBot, _cnpj, _name, _telefone, _file, JSON.stringify(order), _origem], (err, result) => {
                if (err) return next(err)
                res.status(200).json({ "hashfile": _hashfile, "descfile": _descfile, "type": _type, "data": order })
            })
        } else {
            dbcc.query("INSERT INTO tab_input_excel(id, sessionid, cnpj, `name`, telefone, `file`, `filedata`, origem, status) VALUES(?,?,?,?,?,?,?,?,3)", [order.id, _sessionBot, _cnpj, _name, _telefone, _file, JSON.stringify(order), _origem], (err, result) => {
                if (err) return next(err)
                res.status(400).json({ "data": order, "detail": "Distribuidor não encontrado", "not_found": not_found.join(", ") })
            })
        }

    } catch (err) {
        return next(err)
    }

    function parseDistribuidor(data, data2) {
        return new Promise((resolve, reject) => {
            let wholesalers = []

            for (let i = 0; i < data.length; i++) {
                const element = data[i];
                if (Object.keys(element).indexOf("nome do distribuidor") != -1) {
                    var dist = data2.filter(distribuidor => String(distribuidor.filial).toUpperCase().replace(/ /g, "").trim() == String(element["nome do distribuidor"]).toUpperCase().replace(/ /g, "").trim())
                    if (dist.length > 0) wholesalers.push({
                        "distribuidor": dist[0].filial,
                        "cnpj": dist[0].cnpj,
                        "estado": dist[0].estado,
                        "prazo": element["prazo do distribuidor"]
                    })
                }
            }

            let sheet_distribuidores = data.map(element => {
                if (Object.keys(element).indexOf("nome do distribuidor") != -1) return String(element["nome do distribuidor"]).toUpperCase().replace(/ /g, "").trim()
            }).filter(item => item)

            let not_found = sheet_distribuidores.filter(item => wholesalers.map(w => String(w.distribuidor).toUpperCase().replace(/ /g, "").trim()).indexOf(item) === -1)

            console.log(wholesalers, sheet_distribuidores, not_found)

            resolve({
                wholesalers,
                not_found
            })
        })
    }

    function parseArray(products) {
        return new Promise((resolve, reject) => {
            try {
                let newProducts = []
                for (var i = 0; i < products.length; i++) {
                    let prod = products[i]
                    let newProd = {}
                    for (var j = 0; j < Object.keys(prod).length; j++) {
                        let key = Object.keys(prod)[j]
                        let formatedKey = Object.keys(prod)[j].toLowerCase().trim()

                        newProd[formatedKey] = prod[key]
                    }
                    newProducts.push(newProd)
                }

                resolve(newProducts)
            } catch (err) {
                reject(err)
            }
        })
    }

    function downloadFile(url) {
        return new Promise((resolve, reject) => {
            let file = fs.createWriteStream('/home/ubicua/sanofi-ccs-cleo/input-email/temp.xlsx');
            file.on('close', function () {
                resolve(file)
            })

            https.get(url, function (response) {
                response.on('data', function (chunk) {
                    file.write(chunk)
                })
                response.on('end', function () {
                    file.close()
                    file.end()
                    console.log('download file completed.')
                })
                response.on("error", function (err) {
                    file.destroy()
                    reject(err)
                })
            })
        })
    }
})

app.get('/api/v1/get_excel_info', async function (req, res, next) {
    var session = req.query.session
    dbcc.query("SELECT * FROM tab_input_excel WHERE sessionid = ?", [session], function (err, result) {
        if (err) return next(err)
        res.status(200).json(result)
    })
});

app.get('/api/v1/input_excel_model/:id', function (req, res, next) {
    var modelo = req.params.id

    var _path = "/home/ubicua/sanofi-ccs-cleo/public/inputExcel/";
    var _file = ""

    if (modelo == "1") {
        _file = "pedido_generico.xlsx"
    } else if (modelo == "2") {
        _file = "pedido_otc.xlsx"
    } else if (modelo == "3") {
        _file = "pedido_medicamento_prescricao.xlsx"
    } else {
        res.sendStatus(404)
    }

    res.download(_path + _file)
})

app.post('/api/v1/botlog', function (req, res, next) {
    console.log(">> BOT LOG")
    console.log(req.body)
    var data = req.body.data
    var { chat_session_id, session_id, destination, message, text = [], name = "", cnpj = "" } = data

    dbcc.query("SELECT uuid() as UUID;", async function (err, id) {
        var _custom_uid = id[0].UUID;
        var _session = (destination == "BOT" || destination == "TRANSBORDO") ? chat_session_id : session_id

        dbcc.query("SELECT * FROM tab_atendein WHERE sessionBot=? LIMIT 1", [_session], function (err, result) {
            if (err) return next(err)
            console.log(result)
            if (result.length > 0) { // SESSÃO CCS
                if (data.destination == "BOT" || destination == "TRANSBORDO") {
                    var _id = _custom_uid;
                    var _sessionid = result[0].sessionBot;
                    var _fromid = result[0].fkto;
                    var _fromname = result[0].fkname;
                    var _toid = result[0].mobile
                    var _toname = result[0].name
                    var _msgdir = "i"
                    var _msgtype = "chat";
                    var _msgtext = emoji.unifiedToHTML(message);
                    var _msgurl = "";
                    var _msgcaption = "";
                    var _msgorigem = "chatweb"

                    if (message != '') {
                        dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext, msgurl, msgcaption, origem) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [_id, _sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext, _msgurl, _msgcaption, _msgorigem], function (err, result) {
                            if (err) return next(err)
                            log("ATOS bot - Novo Registro LOG Inserido", _id);
                        });
                    }

                    res.status(200).json(result)


                } else {
                    for (let i = 0; i < text.length; i++) {
                        var element = text[i];
                        var _id = "UUID()";
                        var _sessionid = result[0].sessionBot;
                        var _fromid = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _fromname = "Bot";
                        var _toid = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _toname = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _msgdir = "o";
                        var _msgtype = "chat";
                        var _msgtext = emoji.unifiedToHTML(element);
                        var _msgurl = "";
                        var _msgcaption = "";
                        var _msgorigem = "chatweb"

                        dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext, msgurl, msgcaption, origem) VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?)", [_sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext, _msgurl, _msgcaption, _msgorigem], function (err, result) {
                            if (err) return next(err)
                            log("ATOS bot - Novo Registro LOG Inserido");
                        });
                    }

                    res.status(200).json(result)

                }
            } else { // NENHUMA SESSÃO CRIADA NO CCS
                if (data.destination == "BOT" || destination == "TRANSBORDO") {
                    var _id = _custom_uid;
                    var _sessionid = _session;
                    var _fromid = cnpj;
                    var _fromname = name;
                    var _toid = cnpj;
                    var _toname = cnpj;
                    var _msgdir = "i";
                    var _msgtype = "chat";
                    var _msgtext = emoji.unifiedToHTML(message);
                    var _msgurl = "";
                    var _msgcaption = "";
                    var _msgorigem = "chatweb"

                    if (message != '') {
                        dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext, msgurl, msgcaption, origem) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)", [_id, _sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext, _msgurl, _msgcaption, _msgorigem], function (err, result) {
                            if (err) return next(err)
                            log("ATOS bot - Novo Registro LOG Inserido", _id);
                        });
                    }

                    res.status(200).json(result)

                } else {
                    for (let i = 0; i < text.length; i++) {
                        var element = text[i];
                        // var _id = _custom_uid;
                        var _sessionid = _session;
                        var _fromid = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _fromname = "Bot";
                        var _toid = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _toname = "491b9564-2d79-11ea-978f-2e728ce88125";
                        var _msgdir = "o";
                        var _msgtype = "chat";
                        var _msgtext = emoji.unifiedToHTML(element);
                        var _msgurl = "";
                        var _msgcaption = "";
                        var _msgorigem = "chatweb"

                        dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext, msgurl, msgcaption, origem) VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?)", [_sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext, _msgurl, _msgcaption, _msgorigem], function (err, result) {
                            if (err) return next(err)
                            log("ATOS bot - Novo Registro LOG Inserido", _id);
                        });
                    }

                    res.status(200).json(result)
                }
            }
        });
    })
});

app.post('/api/v1/message', function (req, res, next) {
    var _hostin = "LON";
    var _event = req.body.event;
    if (_event === "message") {
        log("Event: Message", req.body);
        var _uid = req.body.uid;
        var _dtin = getTimestamp();
        var _contact_uid = req.body.contact.uid;
        var _contact_name = req.body.contact.name;
        var _contact_type = req.body.contact.type;
        var _message_type = req.body.message.type;
        var _message_ack = req.body.message.ack;
        var _message_cuid = req.body.message.cuid;
        var _message_dir = req.body.message.dir;
        var _message_dtm = req.body.message.dtm;
        var _message_type = req.body.message.type;
        var _message_uid = req.body.message.uid;
        if (_contact_uid.indexOf('status') < 0) {
            if (_message_type === "chat") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    // var _body_text = emoji.unifiedToHTML(req.body.message.content.text);
                    var _body_text = emoji.unifiedToHTML(req.body.message.body.text);
                    //console.log('======================================\n');
                    //console.log(_body_text);
                    //console.log('======================================\n\n');
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "image") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_caption = req.body.message.body.caption;
                    var _body_mimetype = req.body.message.body.mimetype;
                    var _body_size = req.body.message.body.size;
                    var _body_thumb = req.body.message.body.thumb;
                    var _body_url = req.body.message.body.url;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size, body_thumb, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_thumb, _body_url";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_thumb, _body_url], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "video") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_caption = req.body.message.body.caption;
                    var _body_mimetype = req.body.message.body.mimetype;
                    var _body_size = req.body.message.body.size;
                    var _body_duration = req.body.message.body.duration;
                    var _body_thumb = req.body.message.body.thumb;
                    var _body_url = req.body.message.body.url;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size, body_duration, body_thumb, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_thumb, _body_url";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_thumb, _body_url], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "audio") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_caption = req.body.message.body.caption;
                    var _body_mimetype = req.body.message.body.mimetype;
                    var _body_size = req.body.message.body.size;
                    var _body_duration = req.body.message.body.duration;
                    var _body_url = req.body.message.body.url;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size, body_duration, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_url";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_url], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "ptt") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_caption = req.body.message.body.caption;
                    var _body_mimetype = req.body.message.body.mimetype;
                    var _body_size = req.body.message.body.size;
                    var _body_duration = req.body.message.body.duration;
                    var _body_url = req.body.message.body.url;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size, body_duration, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_url";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_duration, _body_url], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "document") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_caption = req.body.message.body.caption;
                    var _body_mimetype = req.body.message.body.mimetype;
                    var _body_size = req.body.message.body.size;
                    var _body_thumb = req.body.message.body.thumb;
                    var _body_url = req.body.message.body.url;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size,  body_thumb, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_thumb, _body_url";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_caption, _body_mimetype, _body_size, _body_thumb, _body_url], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "vcard") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_contact = req.body.message.body.contact;
                    var _body_vcard = req.body.message.body.vcard;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_contact, body_vcard, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_contact, _body_vcard";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_contact, _body_vcard], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            } else if (_message_type === "location") {
                if (_contact_uid.indexOf('g.us') > -1) {
                    onrefusegroup(_contact_uid.substring(0, _contact_uid.search("-")));
                } else {
                    var _body_name = req.body.message.body.name;
                    var _body_lng = req.body.message.body.lng;
                    var _body_lat = req.body.message.body.lat;
                    var _body_thumb = req.body.message.body.thumb;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_name, body_lng, body_lat, body_thumb, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_name, _body_lng, _body_lat, _body_thumb";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_name, _body_lng, _body_lat, _body_thumb], function (err, rows, fields) {
                        if (err) { log("Erro ao Receber Mensagem do WABOXAPP: " + err); } else { log("Nova Mensagem Recebida WABOXAPP..."); }
                    });
                }
            }
        }

        dbcc.query("UPDATE tab_config SET waendpoint=? WHERE id=1", [_hostin]);
        res.sendStatus(200);
    } else if (_event == "ack") {
        log("ACK Received", req.body);
        res.sendStatus(200);
    }
});

app.post('/api/v2/message', function (req, res, next) {

    log("Event: Message", req.body);
    var _key = req.body.token;
    var _type = req.body.event;
    var _hostin = "BRA";
    if (_type === "message") {
        var _uid = req.body.uid;
        var _dtin = getTimestamp();
        var _contact_uid = req.body.contact_uid;
        var _contact_name = req.body.contact_name;
        var _contact_type = req.body.contact_type;
        var _message_ack = req.body.message_ack;
        var _message_cuid = req.body.message_cuid;
        var _message_dir = req.body.message_dir;
        var _message_dtm = req.body.message_dtm;
        var _message_type = req.body.message_type;
        var _message_uid = req.body.message_uid;
        if (_message_type === "chat") {
            var _body_text = emoji.unifiedToHTML(req.body.body_text);
            var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
            var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text";
            dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text], function (err, rows, fields) {
                if (err) {
                    log("Erro ao Receber Mensagem do BRA: " + err);
                } else {
                    dbcc.query("UPDATE tab_config SET waendpoint=? WHERE id=1", [_hostin]);
                    log("Nova Mensagem Recebida BRA...");
                }
            });
            res.json({ "key": _key, "ack": "3" });
        }
    } else {
        res.status(200).send('Ok');
    }
});

app.post('/api/bot/check_whatsapp', function (req, res, next) {
    try {
        let session = req.body.sessionid
        console.log("/api/v1/check_whatsapp")
        console.log(req.body)

        dbcc.query("SELECT origem FROM tab_filain WHERE sessionBot = ?", [session], function (err, result, fields) {
            if (err) console.log(err);
            console.log(result)
            if (result.length > 0) {
                res.status(200).json({ "whatsapp": (result[0]["origem"] == "wpp") ? true : false })
            } else {
                res.status(200).json({ "whatsapp": false })
            }
        })

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
});

app.post('/api/bot/check_optin', function (req, res, next) {
    try {
        let cnpj = req.body.cnpj
        console.log("/api/v1/check_optin")
        console.log(req.body)

        dbcc.query("SELECT * FROM tab_optin WHERE cnpj = ?", [cnpj], function (err, result, fields) {
            if (err) console.log(err);
            console.log(result)
            res.status(200).json({ "optin": (result.length > 0) ? true : false, "result": result })

        })
    } catch (err) {
        res.status(500).send(err)
    }
});

app.post('/api/bot/check_skip_bot', function (req, res, next) {
    try {
        let cnpj = req.body.cnpj
        // Normalize CNPJ to digits only
        if (cnpj && typeof cnpj === 'string') {
            cnpj = cnpj.replace(/\D/g, '')
        }
        console.log("/api/v1/check_skip_bot")
        console.log(req.body)

        dbcc.query("SELECT * FROM tab_skip_bot WHERE cnpj = ?", [cnpj], function (err, result, fields) {
            if (err) {
                console.log(err);
                return res.status(500).send(err)
            }
            const found = result.length > 0
            res.status(200).json({ "skip_bot": found, "result": result })
        })
    } catch (err) {
        res.status(500).send(err)
    }
});

app.post('/api/bot/cadastro_optin', function (req, res, next) {
    try {
        let { cnpj, phone, email } = req.body
        console.log("/api/v1/cadastro_optin")
        console.log(req.body)

        dbcc.query("SELECT * FROM tab_optin WHERE cnpj = ?", [cnpj], async (err, result, fields) => {
            if (err) console.log(err);
            console.log(result)
            if (result.length > 0) {
                let query = "UPDATE tab_optin SET phone=?, email=?, update_chatbot=CURRENT_TIMESTAMP() WHERE cnpj = ?"
                let params = [phone, email, cnpj]
                await dbcc.query(query, params)

            } else {
                let query = "INSERT INTO tab_optin(cnpj, phone, email, update_chatbot) VALUES(?,?,?, CURRENT_TIMESTAMP())"
                let params = [cnpj, phone, email]
                await dbcc.query(query, params)
            }

            res.sendStatus(200)

        })
    } catch (err) {
        res.status(500).send(err)
    }
});

app.post('/api/bot/update_optin', function (req, res, next) {
    try {
        let { cnpj } = req.body
        console.log("/api/v1/update_optin")
        console.log(req.body)
        dbcc.query("SELECT * FROM tab_optin WHERE cnpj = ?", [cnpj], async (err, result, fields) => {
            if (err) console.log(err);
            console.log(result)
            if (result.length > 0) {
                // ** INSERT ACESSO
                let query_insert = "INSERT INTO tab_acesso_optin (cnpj, acesso) VALUES (?, CURRENT_TIMESTAMP())"
                let params_insert = [cnpj]
                await dbcc.query(query_insert, params_insert)
                // ** UPDATE OPTIN
                let query_update = "UPDATE tab_optin SET acesso_chatbot=CURRENT_TIMESTAMP() WHERE cnpj = ?"
                let params_update = [cnpj]
                await dbcc.query(query_update, params_update)
            }
            res.sendStatus(200)
        })
    } catch (err) {
        res.status(500).send(err)
    }
});

app.post('/api/bot/transbordo', function (req, res, next) {
    var auth = req.headers['authorization'];
    //console.log("Authorization Header is: ", auth);
    console.log("Transbordo Bot")
    console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'atosBot') && (password == 'd8511353660467bb8e8c68016053bd9e')) {
            var _cnpj = (req.body.cnpj) ? req.body.cnpj.replace(/[^\w\s]/gi, '') : '';
            var _sessionid = req.body.sessionid
            var _mobile = _cnpj
            var _telefone = req.body.telefone
            var _email = req.body.email
            var _segmento = req.body.segmento

            dbcc.query("SELECT * FROM tab_atendein WHERE cnpj = ? OR sessionBot = ?", [_cnpj, _sessionid], function (err, result) {
                if (err) res.json({ status: 'falha', resultado: err });
                if (result.length == 0) {
                    dbcc.query('SELECT * FROM tab_filain WHERE cnpj=? or sessionBot = ?', [_cnpj, _sessionid], function (err, result) {
                        if (err) res.json({ status: 'falha', resultado: err });
                        if (result.length == 0) {
                            dbcc.query('SELECT * FROM tab_atendein WHERE status=0 and mobile=?', [_cnpj], function (err, result) {
                                if (result.length == 0) {

                                    dbcc.query("INSERT INTO tab_filain (mobile, cnpj, telefone, email, sessionBot, status, origem, segmento, context) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)", [_mobile, _cnpj, _telefone, _email, _sessionid, 'bot', _segmento, 'TransbordoBot'], function (err, result) {
                                        if (err) {
                                            //console.log(err);
                                            if (err) res.json({ status: 'falha', resultado: err });
                                        } else {
                                            // Necessario Mandar mensagem de boas vindas via API ATOS
                                            var _normal = "Seja bem vindo ao novo canal exclusivo para Clientes Conecta PDV. Adicione esse número de telefone e faça seus pedidos via WhatsApp de segunda a sexta das 09h às 20h.\n\nPara agilizar seu atendimento, por favor informe seu nome e CNPJ.";
                                            var _feriado = "Nosso time de analistas está em horário de descanso. Mas fique tranquilo, retornamos no próximo dia útil a partir das 9h pronto para te auxiliar ok?! Fique a vontade para entrar em contato novamente ou aguarde nosso contato. Até mais!";
                                            var _treinamento = "Neste momento todos os nossos representantes estão em treinamento, retornaremos em breve.";
                                            var _message = "Obrigada pelo seu contato, neste momento este canal está indisponível.\n\nPor gentileza entre em contato pelo 0800 721 0100 para realizar o seu pedido.\n\nEm breve retornaremos o atendimento neste canal";
                                            dbcc.query('SELECT training from tab_treinamento where id="c102ba05-422c-11ea-8db1-000c290cc03d"', function (err, result) {
                                                if (result[0].training == 'true') {
                                                    _message = _treinamento
                                                    sendWelcome(_sessionid, _cnpj, _message, _segmento)
                                                } else if (new Date().getHours() >= 20) {
                                                    _message = _feriado
                                                    sendWelcome(_sessionid, _cnpj, _message, _segmento)
                                                } else {
                                                    sendWelcome(_sessionid, _cnpj, _message, _segmento)
                                                }
                                            });
                                            res.json({ status: 'falha', resultado: 'Plataforma Desativada' });
                                            // res.json({ status: '200', resultado: 'Usuario inserido em nossa plataforma' });
                                        }
                                    });
                                } else {
                                    res.json({ status: '400', resultado: 'Usuario já se encontra em nossa plataforma' });
                                }
                            });
                        } else {
                            dbcc.query("UPDATE tab_filain SET origem='wpp', status=1, segmento=?, context='TransbordoBot' WHERE sessionBot = ?", [_segmento, _sessionid], function (err, result) {
                                if (err) res.json({ status: 'falha', resultado: err });
                                else res.json({ status: '200', resultado: 'Transferindo para atendimento com humano' });
                            })
                        }
                    });
                } else {
                    res.json({ status: '200', resultado: 'Usuario em atendimento com humano' });
                }
            })

        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
});

app.post('/api/bot/encerraBot', function (req, res, next) {
    var { session, old_sessions, pedido, name, mobile, cnpj, email, telefone, destination, dtin, dtat, avaliacao, segmento } = req.body
    console.log("EncerraBot: " + JSON.stringify(req.body))

    dbcc.query("SELECT *, dt as date FROM tab_logs WHERE sessionid = ? ORDER BY dt", [session], function (err, result) {
        var _chatbot = JSON.stringify(result)
        dbcc.query("SELECT * FROM tab_filain WHERE sessionbot = ?", [session], function (err, result) {
            if (err) return next(err)
            console.log(result)
            if (result.length > 0) {
                var _mobile = result[0].mobile;
                var _dtin = result[0].dtin;
                var _name = result[0].name;
                var _account = result[0].account;
                var _photo = result[0].photo;
                var _fkto = "491b9564-2d79-11ea-978f-2e728ce88125";
                var _fkname = "Bot";
                var _atendir = "in"
                var _sessionBot = result[0].sessionBot;
                var _status = -1
                var _origem = result[0].origem;
                var _destino = 'bot'
                var _cnpj = result[0].cnpj
                var _email = result[0].email
                var _telefone = result[0].telefone
                var _pedido = pedido.order_id
                var _total = pedido.total_value
                var _avaliacao = avaliacao

            } else {
                var _mobile = telefone;
                var _dtin = new Date(dtin.replace("T", " ").replace("Z", ""));
                _dtin = new Date(_dtin.setHours(_dtin.getHours() - 3))

                var _name = name;
                var _account = "";
                var _photo = "";
                var _fkto = "491b9564-2d79-11ea-978f-2e728ce88125";
                var _fkname = "Bot";
                var _atendir = "in"
                var _sessionBot = session;
                var _status = -1
                var _origem = "bot";
                var _destino = 'bot'
                var _cnpj = cnpj
                var _email = email
                var _telefone = telefone
                var _pedido = pedido.order_id
                var _total = pedido.total_value
                var _avaliacao = avaliacao
            }

            dbcc.query("INSERT INTO tab_encerrain (sessionid, mobile, dtin, name, account, photo, fkto, fkname, status, cnpj, atendir, sessionBot, segmento, origem, email, telefone, pedido, avaliacao) VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [_mobile, _dtin, _name, _account, _photo, _fkto, _fkname, _status, _cnpj, _atendir, _sessionBot, segmento, _origem, _email, _telefone, _pedido, _avaliacao], async function (err, result) {
                if (err) return next(err)
                console.log("ENCERRADO PELO BOT: " + result)

                await insertPedido(_sessionBot, _pedido, segmento, _total, new Date())
                if (old_sessions) {
                    for (let i = 0; i < old_sessions.length; i++) {
                        const element = old_sessions[i];

                        dbcc.query("UPDATE tab_encerrain SET avaliacao=? WHERE sessionBot=?", [_avaliacao, element], function (err, result) {
                            console.log("Atualizando pesquisa NPS: ", element)
                        })
                    }
                }

                dbcc.query("DELETE FROM tab_filain WHERE sessionBot = ?", [session], function (err, result) {
                    if (err) return next(err)
                    res.status(200).send(result)
                })


                // dbcc.query("INSERT INTO tab_transbordo (id,cnpj,sessionBot,email,origem,destino,telefone,chatbot,dtin,dten) VALUES (uuid(),?,?,?,?,?,?,?,?,?)", [_cnpj, _sessionBot, _email, _origem, _destino, _telefone, _chatbot, _dtin, new Date().toISOString().replace("T", " ").replace("Z", "")], function (err, result) {
                //     if (err) return next(err)
                //     console.log("INSERINDO TAB_TRANSBORDO")
                //     dbcc.query("DELETE FROM tab_filain WHERE sessionBot = ?", [session], function (err, result) {
                //         if (err) return next(err)
                //         res.status(200).send(result)
                //     })
                // })
            })
        })
    })
})

app.post('/api/bot/confirmaPedido', async function (req, res, next) {
    var { session, pedido, segmento } = req.body
    console.log("confirmaPedido: " + JSON.stringify(req.body))

    var _pedido = pedido.order_id
    var _total = pedido.total_value
    var dtpedido = new Date()
    await insertPedido(session, _pedido, segmento, _total, dtpedido)

    res.sendStatus(200)
})

app.post('/api/bot/message_old', function (req, res, next) {
    var auth = req.headers['authorization'];
    //console.log("Authorization Header is: ", auth);
    ////console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'atosBot') && (password == 'd8511353660467bb8e8c68016053bd9e')) {
            var _cnpj = req.body.cnpj.replace(/[^\w\s]/gi, '');
            dbcc.query('SELECT * FROM tab_filain WHERE status=1 and mobile=? and sessionBot=?', [_cnpj, req.body.sessionid], function (err, result) {
                if (result.length == 0) {
                    dbcc.query('SELECT * FROM tab_atendein WHERE status=0 and mobile=? and sessionBot=?', [_cnpj, req.body.sessionid], function (err, result) {
                        if (result.length == 0) {
                            res.json({
                                status: '400',
                                resultado: 'Usuario não se encontra cadastrado em nossa plataforma'
                            });
                        } else {
                            var _hostin = "LON";
                            var _uid = '5511969009126';
                            var _dtin = getTimestamp();
                            var _contact_uid = _cnpj;
                            var _contact_name = '';
                            var _contact_type = 'User';
                            var _message_type = 'chat';
                            var _message_ack = '2';
                            var _message_cuid = '';
                            var _message_dir = 'i';
                            var _message_dtm = new Date().getTime();
                            var _message_uid = 'custom_uid';
                            var _body_text = req.body.message;
                            var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                            var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text";
                            dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text], function (err, rows, fields) {
                                if (err) {
                                    res.json({
                                        status: 'falha',
                                        resultado: 'err'
                                    });
                                } else {
                                    res.json({
                                        status: '200',
                                        resultado: 'Mensagem Cadastrada'
                                    });
                                }
                            });
                        }
                    });
                } else {
                    var _hostin = "LON";
                    var _uid = '5511969009126';
                    var _dtin = getTimestamp();
                    var _contact_uid = _cnpj;
                    var _contact_name = '';
                    var _contact_type = 'User';
                    var _message_type = 'chat';
                    var _message_ack = '2';
                    var _message_cuid = '';
                    var _message_dir = 'i';
                    var _message_dtm = new Date().getTime();
                    var _message_uid = 'custom_uid';
                    var _body_text = req.body.message;
                    var qry = 'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)';
                    var params = "_host, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text";
                    dbcc.query(qry, [_hostin, _uid, _dtin, _contact_uid, _contact_name, _contact_type, _message_dtm, _message_uid, _message_cuid, _message_dir, _message_type, _message_ack, _body_text], function (err, rows, fields) {
                        if (err) {
                            res.json({
                                status: 'falha',
                                resultado: 'err'
                            });
                        } else {
                            res.json({
                                status: '200',
                                resultado: 'Mensagem Cadastrada'
                            });
                        }
                    });
                }
            });
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
})

app.post('/api/bot/message', function (req, res, next) {
    var auth = req.headers['authorization'];
    //console.log("Authorization Header is: ", auth);
    ////console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'atosBot') && (password == 'd8511353660467bb8e8c68016053bd9e')) {
            res.json({
                status: '200',
                resultado: 'Mensagem Cadastrada'
            });
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
})

app.post('/api/bot/chat', function (req, res, next) {
    var auth = req.headers['authorization'];
    console.log("Authorization Header is: ", auth);
    console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'atosBot') && (password == 'd8511353660467bb8e8c68016053bd9e')) {
            var _cnpj = req.body.cnpj.replace(/[^\w\s]/gi, '');
            var _sessionBot = req.body.sessionid;
            var _email = req.body.email;
            var _segmento = req.body.segmento
            var _origem = 'bot';
            var _destino, _dten;
            var _telefone = req.body.telefone;
            var _chatBot = JSON.stringify(req.body.chat);
            console.log(_chatBot)
            var _dtin = req.body.dataini;
            if (_chatBot.indexOf('Sou seu assistente virtual do canal de compras via WhatsApp do grupo Sanofi Medley e vou te auxiliar. Qual') > -1) {
                res.json({ status: 'falha', resultado: 'Historico de WhatsApp já cadastrado' });
            } else if (req.body.transfer != null && req.body.transfer != '' && req.body.sessionid != null && req.body.sessionid != '') {
                if (req.body.transfer == 'False') {
                    _destino = 'bot';
                    _dten = new Date().toISOString().slice(0, 19).replace('T', ' ');
                } else {
                    _destino = 'human';
                }
                dbcc.query('SELECT * FROM tab_transbordo WHERE sessionBot=? AND origem = "bot"', [_sessionBot], function (err, result) {
                    if (result.length == 0) {
                        dbcc.query('SELECT * FROM tab_transbordo WHERE sessionBot=? AND origem = "wbot"', [_sessionBot], function (err, result) {
                            if (result.length == 0) {
                                dbcc.query("INSERT INTO tab_transbordo (id,cnpj,sessionBot,email,origem,destino,telefone,chatBot,dtin,dten,segmento) VALUES (uuid(),?,?,?,?,?,?,?,?,?,?)", [_cnpj, _sessionBot, _email, _origem, _destino, _telefone, _chatBot, _dtin, _dten, _segmento], function (err, result) {
                                    if (err) {
                                        res.json({ status: 'falha', resultado: 'err' });
                                    } else {
                                        res.json({ status: '200', resultado: 'Historico gravado com sucesso' });
                                    }
                                });
                            } else {
                                res.json({ status: 'falha', resultado: 'Historico de WhatsApp já cadastrado' });
                            }
                        });
                    } else {
                        if (_dten != null) {
                            dbcc.query("UPDATE tab_transbordo SET cnpj = ?, email = ?, telefone = ?, chatBot = ?, destino = ?, dten = ?, origem = ?, segmento = ? WHERE sessionBot = ?;", [_cnpj, _email, _telefone, _chatBot, _destino, _dten, _origem, _segmento, _sessionBot], function (err, result) {
                                if (err) {
                                    res.json({ status: 'falha', resultado: 'err' });
                                } else {
                                    res.json({ status: '200', resultado: 'Historico atualizado com sucesso' });
                                }
                            });
                        } else {
                            dbcc.query("UPDATE tab_transbordo SET cnpj = ?, email = ?, telefone = ?, chatBot = ?, destino = ?, origem = ?, segmento = ? WHERE sessionBot = ?;", [_cnpj, _email, _telefone, _chatBot, _destino, _origem, _segmento, _sessionBot], function (err, result) {
                                if (err) {
                                    res.json({ status: 'falha', resultado: 'err' });
                                } else {
                                    res.json({ status: '200', resultado: 'Historico atualizado com sucesso' });
                                }
                            });
                        }

                    }
                });
            }
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
});

app.post('/api/bot/status', async function (req, res, next) {
    var auth = req.headers['authorization'];
    console.log("Authorization Header is FOR STATUS: ", auth);
    console.log(new Date().toISOString());
    //console.log(req.body);
    var { commit_order, unfinished_order_details, journey } = JSON.parse(req.body.data);
    var jsonAtos = journey
    console.log(">> JSON Atos: ", jsonAtos);
    if (!auth) {
        res.json({ status: '401', resultado: 'Sorry! Invalid Authentication.' });
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'atosBot') && (password == 'd8511353660467bb8e8c68016053bd9e')) {
            var _segmento = null;
            var _sessionBot = jsonAtos.session_id;
            var _consultar_pedido = jsonAtos.consultar_pedido.toString();
            var _orcamento = jsonAtos.orcamento.toString();
            var _novo_pedido = jsonAtos.novo_pedido.toString();
            var _vacina = jsonAtos.vacina.toString();
            var _convert_compra = jsonAtos.convert_compra.toString();
            var _pedidos = JSON.stringify(jsonAtos.pedidos);
            var _transbordo_intent = jsonAtos.tranbordo;
            var _pedido = (jsonAtos.pedidos.length > 0) ? jsonAtos.pedidos[0].pedido : false
            var _pedido_valor = jsonAtos.valor_total.toString();
            var _jornadaStatus = jsonAtos.finalizado.toString();
            var _avaliacao = null
            var _cnpj = (jsonAtos.cnpj) ? jsonAtos.cnpj.toString() : "";
            var _createdAt = (jsonAtos.date_time) ? String(jsonAtos.date_time).replace("T", " ").slice(0, -2) : null

            // Listar historico de conversa na logs
            let _logs = await runDynamicQuery("SELECT msgtext FROM tab_logs WHERE sessionid = ? ORDER BY dt", _sessionBot)

            if (_logs.length > 0) {
                _logs = _logs.map(el => el.msgtext)
                var regexp = /Muito obrigada pela sua avaliação. Eu e a Sanofi agradecemos o seu contato!/

                var index = findIndexByRegex(_logs, regexp)
                if (index != -1) _avaliacao = _logs[(index - 1)]
            }

            if (_pedido_valor != "" && _pedido_valor != "false" && _pedido_valor != null && _pedido_valor != undefined) {
                _convert_compra = "true"
            }

            if (_pedido) {
                for (let i = 0; i < jsonAtos.pedidos.length; i++) {
                    const element = jsonAtos.pedidos[i];
                    _pedido = element.pedido
                    // let _seguimento = (element.condicao.indexOf("CHC") != -1) ? "CHC" : "GEM"
                    _segmento = jsonAtos.segmento
                    console.log("> Pedido: " + _pedido)

                    let net_value = await calculoPedidoSanofi(element.produtos)
                    let newPedido = await insertPedido(_sessionBot, _pedido, _segmento, net_value, _createdAt)
                }

            }

            let transbordo = await insertTransbordo(_sessionBot, _cnpj, _consultar_pedido, _orcamento, _novo_pedido, _vacina, _convert_compra, _pedidos, _transbordo_intent, _jornadaStatus, _pedido_valor, _createdAt, _segmento, _avaliacao)
            res.json(transbordo)

        } else {
            res.json({ status: '401', resultado: 'Sorry! Invalid Authentication.' });
        }
    }
});

app.post('/api/bot/email', async function (req, res, next) {
    var { chat_session_id } = req.body;
    console.log("BOT EMAIL")
    console.log(req.body)
    var qry = "SELECT a.*, b.mobile, b.origem, b.email, b.name, b.dtin FROM tab_logs as a LEFT JOIN tab_encerrain as b ON a.sessionid = b.sessionBot WHERE b.sessionBot = ? order by a.dt";
    //console.log(qry)
    dbcc.query(qry, [chat_session_id], function (err, result) {
        if (err) {
            log("Erro: " + err);
            return next(err)
        } else {
            // Create Worksheet
            let filename = "historico" + chat_session_id + ".pdf"
            let path = process.env.CCS_TEMPLATEPATH + `/${chat_session_id}.pdf`
            let email = result[0].email
            var name = (result[0].name) ? result[0].name : ''
            var dtin = result[0].dtin
            var dtConversa = new Date(dtin).toLocaleDateString()
            var timeConversa = new Date(dtin).toLocaleTimeString()
            generateHistoryPdf(chat_session_id, true).then(result => {
                try {
                    var emailASerEnviado = {
                        from: "no-reply@sanofi-mobile.com.br",
                        to: email,
                        text: `Olá, ${name}\n\nSegue anexo o histórico da nossa conversa de ${dtConversa} ás ${timeConversa}\n\nObrigado por acessar nosso Canal!\nBons negócios!`,
                        subject: "Historico de atendimento - Sanofi",
                        attachments: [{ // Basta incluir esta chave e listar os anexos
                            filename: filename, // O nome que aparecerá nos anexos
                            path: path // O arquivo será lido neste local ao ser enviado
                        }]
                    };

                    sendEmail(emailASerEnviado).then(result => {
                        console.log(result)
                        res.send(result)
                    }).catch(err => {
                        console.log("Erro ao enviar email: " + err)
                    })
                } catch (err) {
                    log("Error writing to file ", err);
                    return next(err)
                }
            }).catch(err => {
                return next(err)
            })
        }
    });
})

app.post('/api/bot/user_connect_chatweb', async function (req, res, next) {
    var _sessionid = req.body.session_id
    console.log(_sessionid)

    dbcc.query("SELECT * FROM tab_atendein WHERE sessionBot=? LIMIT 1", [_sessionid], function (err, result) {
        if (result.length > 0) {
            var _fromid = "491b9564-2d79-11ea-978f-2e728ce88125";
            var _fromname = "Bot";
            var _toid = result[0].mobile;
            var _toname = result[0].name;
            var _msgdir = "o";
            var _msgtype = "connect";
            var _msgtext = "Cliente se conectou ao chatweb";
            var _atendir = result[0].atendir;
            dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext) VALUES(UUID(), ?, ?, ?, ?, ?, ?, ?, ?)", [_sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext], function (err, result) {
                log("Novo Registro LOG de Transferência (conectado) Inserido");
                if (err) log(err);
                res.sendStatus(200)
            })
        }
    })
})

app.post('/api/bot/user_disconnect_chatweb', async function (req, res, next) {
    var _sessionid = req.body.session_id
    console.log(_sessionid)

    dbcc.query("SELECT * FROM tab_atendein WHERE sessionBot=? LIMIT 1", [_sessionid], function (err, result) {
        if (result.length > 0) {
            var _fromid = "491b9564-2d79-11ea-978f-2e728ce88125";
            var _fromname = "Bot";
            var _toid = result[0].mobile;
            var _toname = result[0].name;
            var _msgdir = "o";
            var _msgtype = "disconnect";
            var _msgtext = "Cliente se desconectou do chatweb";
            var _atendir = result[0].atendir;
            dbcc.query("INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext) VALUES(UUID(), ?, ?, ?, ?, ?, ?, ?, ?)", [_sessionid, _fromid, _fromname, _toid, _toname, _msgdir, _msgtype, _msgtext], function (err, result) {
                log("Novo Registro LOG de Transferência (desconectado) Inserido");
                if (err) log(err);
                res.sendStatus(200)
            })
        }
    })
})

app.post('/api/bot/check_agents', async function (req, res, next) {
    let online = await check_agents(io)
    console.log(online)
    res.status(200).json({ online, "training": false })
});

app.get('/api/ubicua/vendas', async function (req, res, next) {
    var auth = req.headers['authorization'];
    //console.log("Authorization Header is: ", auth);
    ////console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];

        var date_start = (req.query.date_start) ? moment(req.query.date_start).format("YYYY-MM-DD 00:00:00") : moment(new Date()).format("YYYY-MM-DD 00:00:00")
        var date_end = (req.query.date_end) ? moment(req.query.date_end).format("YYYY-MM-DD 23:59:59") : moment(new Date()).format("YYYY-MM-DD 23:59:59")

        if ((username == 'ubicua') && (password == 'sZK$eqw^%aJc')) {
            dbcc.query('CALL rt_json_vendas(?,?)', [date_start, date_end], function (err, result) {
                if (err) return next(err)
                else res.json(result[0]);
            });
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
})

app.get('/api/ubicua/report', function (req, res, next) {
    var auth = req.headers['authorization'];
    //console.log("Authorization Header is: ", auth);
    ////console.log(req.body);
    if (!auth) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
        res.end('Sorry! Invalid Authentication.');
    } else if (auth) {
        var tmp = auth.split(' ');
        var buf = new Buffer(tmp[1], 'base64');
        var plain_auth = buf.toString();
        //console.log("Decoded Authorization ", plain_auth);
        var creds = plain_auth.split(':');
        var username = creds[0];
        var password = creds[1];
        if ((username == 'ubicua') && (password == '1zvzrAFyIwKhWqIoyRU9whpdBYoK')) {
            dbcc.query('CALL rt_painelop();', function (err, result) {
                if (err) {
                    //console.log(err)
                    res.json({ status: 'falha', resultado: err });
                } else {
                    res.json({ status: '200', resultado: result });
                }
            });
        } else {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
            res.end('Sorry! Unauthorized Access.');
        }
    }
});

app.post('/api/mola/check', function (req, res, next) {
    let { file } = req.body
    let query = 'SELECT COUNT(*) as count FROM tab_optin WHERE mailing = ?'
    let params = [file]
    dbcc.query(query, params, function (err, result) {
        if (err) res.status(500).send(err)
        res.status(200).json({
            "read": (result[0].count > 0) ? true : false
        })
    });
})

app.post('/api/mola/update', async function (req, res, next) {
    let { mailing, data } = req.body
    // data = data.filter(el => el.cnpj && el.email && el.telefone && el.nome)
    let insert_query = "INSERT IGNORE INTO tab_optin(cnpj, email, phone, nome, mailing) VALUES (?,?,?,?,?)"
    let update_query = "UPDATE tab_optin SET phone = ?, email = ?, nome = ?, mailing = ? WHERE cnpj = ?"


    for (let i = 0; i < data.length; i++) {
        const { cnpj, email, telefone, nome } = data[i];

        let check = await check_cnpj_mola(cnpj)

        if (check) {
            // UPDATE
            dbcc.query(update_query, [telefone, email, nome, mailing, cnpj], function (err, result) {
                if (err) console.log(err)
            })
        } else {
            // INSERT
            dbcc.query(insert_query, [cnpj, email, telefone, nome, mailing], function (err, result) {
                if (err) console.log(err)
            })
        }
    }

    res.sendStatus(200)
})

// END API ROUTES //