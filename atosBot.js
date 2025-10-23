require('./tools')();
const axios = require('axios');
const { resolve, reject } = require('bluebird');

var API, WEBCHAT_URL_GEM, WEBCHAT_URL_CHC;
if (process.env.PROD == "true") {
  WEBCHAT_URL_GEM = process.env.WEBCHAT_URL_GEM
  WEBCHAT_URL_CHC = process.env.WEBCHAT_URL_CHC
  API = {
    "GEM": {
      "api_url": "https://webb.fidelize.com.br/index.php?r=api/graphql/index",
      "api_usr": "chat.bot",
      "api_pwd": "Chat.bot2020",
      "api_portal": "https://conectapdv.sanofi-mobile.com.br"
    },
    "CHC": {
      "api_url": "https://trade.fidelize.com.br/esanofi/index.php?r=api/graphql/index",
      "api_usr": "chat.bot",
      "api_pwd": "Mudar@2023",
      "api_portal": "https://conectachc.sanofi-mobile.com.br"
    }
  }
} else {
  WEBCHAT_URL_GEM = process.env.WEBCHAT_URL_GEM_HML
  WEBCHAT_URL_CHC = process.env.WEBCHAT_URL_CHC_HML
  API = {
    "GEM": {
      "api_url": "https://ttstaging.fidelize.com.br/t4t/index.php?r=api/graphql/index",
      "api_usr": "atos",
      "api_pwd": "s3nh4$00",
      "api_portal": "https://ubicuacloud-dev.rj.r.appspot.com"
    },
    "CHC": {
      "api_url": "https://trade.fidelize.com.br/fabricante/index.php?r=api/graphql/index",
      "api_usr": "chat.bot-teste2",
      "api_pwd": "Mudar@2023",
      "api_portal": "https://ubicuacloud-dev2.rj.r.appspot.com"
    }
  }
}

const TRANSBORDO_MESSAGE_1 = 'Por favor, aguarde um momento enquanto eu transfiro zatendimento para nossa equipe de consultores. Você também pode fazer seu pedido e/ou consulta 24 horas no link {portal}'

const TRANSBORDO_MESSAGE_2 = 'O horário de atendimento dos nossos consultores é de segunda à sexta das 10h às 20h. Por favor, descreva o seu problema, que retornaremos o contato assim que possível. Você também pode fazer seu pedido/consulta 24 horas no link {portal}'

module.exports = function () {
  this.send_message = function (mobile, message) {
    return new Promise(async (resolve, reject) => {
      try {
        let wppJson = {
          "type": "text",
          "toNumber": mobile,
          "txtMessage": message
        }
        // console.log(">> send_message sentinel", response)
        setTimeout(async () => {
          let response = await axios.post(process.env.VONAGE_URL, wppJson)
          resolve(response)
        }, 500);
      } catch (err) {
        reject(err)
      }
    })
  }

  this.send_template_message = function (mobile, template_name, components) {
    return new Promise(async (resolve, reject) => {
      try {
        var payload = {
          'toNumber': mobile,
          'type': 'template_custom',
          'template_name': template_name,
          'template_namespace': "f8ad1a58_f790_49a8_b757_04a56bfd7bc3",
          'components': components
        }

        console.log(`>> template ${template_name} to ${mobile}`)
        let response = await axios.post(process.env.VONAGE_URL, payload)
        resolve(response)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.send_cleo_logo = function (mobile, cleo_url) {
    return new Promise(async (resolve, reject) => {
      let wppJson = {
        "type": "image",
        "toNumber": mobile,
        "mediaUrl": cleo_url,
        "mediaCaption": ""
      }

      let response = await axios.post(process.env.VONAGE_URL, wppJson)
      resolve(response)
    })
  }

  this.send_timeout = function (mobile, sessionBot) {
    return new Promise(async (resolve, reject) => {
      try {
        var _message = "Encerrei o seu atendimento por inatividade. Mas fique tranquilo, você pode me chamar novamente digitando “Olá” no chat!";
        var _fromid = 1;
        var _fromname = "Sistema";
        var _toid = mobile;
        var _msgdir = "o";
        var _msgtype = "chat";
        var _msgtext = _message;

        await this.send_message(mobile, _message)
        await runDynamicQuery("INSERT INTO tab_logs (id, fromid, fromname, toid, msgdir, msgtype, msgtext, sessionid, dt) VALUES(UUID(), ?, ?, ?, ?, ?, ?, ?, TIMESTAMPADD(MINUTE, 1, NOW()))", [_fromid, _fromname, _toid, _msgdir, _msgtype, _msgtext, sessionBot])
        resolve()

      } catch (err) {
        reject(err)
      }
    })
  }

  this.atos_login = function (webchat_url) {
    return new Promise((resolve, reject) => {
      let url = `${webchat_url}/api/login/`
      let payload = { "user_name": "ubicua", "password": "senha$00" }

      axios.post(url, payload)
        .then(result => {
          resolve(result.data.token)
        }).catch(err => {
          reject(err)
        })
    })
  }

  this.atos_token = function (segmento) {
    return new Promise(async (resolve, reject) => {
      let api_url = API[segmento]["api_url"]
      let login = API[segmento]["api_usr"]
      let password = API[segmento]["api_pwd"]

      axios({
        url: api_url,
        method: 'POST',
        data: {
          query: `
            mutation{
              createToken(login: "${login}", password:"${password}"){
                token
                industryName
              }
            }
            `
        }
      }).then((result) => {
        resolve(result.data.data.createToken.token)
      }).catch(err => {
        reject(err)
      })
    })
  }

  this.atos_check_cnpj = function (sessionBot, cnpj, segmento) {
    return new Promise(async (resolve, reject) => {
      let api_url = API[segmento]["api_url"]
      let token = await this.atos_token(segmento)

      axios({
        url: api_url,
        method: 'POST',
        headers: { "Authorization": token },
        data: {
          query: `
            query{
              clientAvailable(customerCode: "${cnpj}") {
                available,
                companyName,
                email,
                phoneNumber
              }
            }
          `
        }
      }).then(async (result) => {
        let available = result.data.data.clientAvailable.available
        let query = `UPDATE tab_filain SET portal_${segmento.toLocaleLowerCase()}=? WHERE sessionBot = ?`
        let params = [available, sessionBot]
        await runDynamicQuery(query, params)
        console.log(`>> Check cnpj ${segmento} - ${cnpj} - ${available}`)
        resolve(available)
      }).catch(err => {
        reject(err)
      })
    })
  }

  this.atos_detect_intent = function (session, message, mobile, segmento, cleoLogo = false) {
    return new Promise(async (resolve, reject) => {
      const webchat_url = (segmento == "GEM") ? WEBCHAT_URL_GEM : WEBCHAT_URL_CHC
      const token = await this.atos_login(webchat_url)
      const url = `${webchat_url}/api/intent/detect/${session}/`;

      const headers = { 'Authorization': 'Bearer ' + token };
      const payload = {
        query_input: { text: message },
        context: await this.get_session_context(session)
      };

      console.log('> Payload a ser enviado ATOS: ', payload);
      console.log('> Url para enviar o payload: ', url);

      axios.post(url, payload, { headers })
        .then(async (response) => {
          console.log('Resposta payload atos: ', response.data);
          let { contexts, intent_name, response_messages, fallback_counters } = response.data
          let intent_response = response_messages.map(el => { return { "text": el.text, "template": false, "transbordo_web": false } })
          let msgText = [{ "text": "", "template": false, "transbordo_web": false }];
          let msgEnd = "Por falta de continuidade em nossa comunicação, encerramos essa interação. Caso queira retomar o contato, por favor, nos envie Oi."

          if (intent_response.length > 0) {
            msgText = intent_response[0]
          }

          if (fallback_counters >= 3) {
            await this.end_bot(session, mobile)
          }

          if (intent_name == "Default Welcome Intent" && cleoLogo) {
            await this.send_cleo_logo(mobile, "https://ccs.sanofi-mobile.com.br/atendente/assets/images/cleo_logo_wpp.png")
          }

          if (intent_name == "1.UsuarioInformaNome") {
            let name = ""
            for (let i = 0; i < contexts.length; i++) {
              const ctx = contexts[i];
              if (Object.keys(ctx["parameters"]).includes("given-name")) { name = ctx["parameters"]["given-name"] }
            }

            await this.update_params(intent_name, [name, session])
          }

          if (["2.UsuarioInformaCnpj", "2.EventoValidCnpj", "2.UsuarioInformaInfs", "2.UsuarioInformaInfsFull"].includes(intent_name)) {
            let cnpj = ""
            let telefone = ""
            let email = ""
            let name = ""

            for (let i = 0; i < contexts.length; i++) {
              const ctx = contexts[i];
              if (Object.keys(ctx["parameters"]).includes("Cnpj")) { cnpj = ctx["parameters"]["Cnpj"] }
              if (Object.keys(ctx["parameters"]).includes("Telefone")) { telefone = ctx["parameters"]["Telefone"] }
              if (Object.keys(ctx["parameters"]).includes("Email")) { email = ctx["parameters"]["Email"] }
              if (Object.keys(ctx["parameters"]).includes("Name")) { name = ctx["parameters"]["Name"] }
            }

            cnpj = extractNumbersFromString(cnpj);

            // Check if cnpj is available to both portals
            if (cnpj) {
              await this.atos_check_cnpj(session, cnpj, 'GEM')
              await this.atos_check_cnpj(session, cnpj, 'CHC')
            }

            await this.update_params(intent_name, [cnpj, email, telefone, name, session])

            let contexts_name = contexts.map(el => el.name.split('/')[6])
            let filter_context = contexts_name.filter(el => el.indexOf("dialog_context") != -1)

            console.log(["2.UsuarioInformaCnpj", "2.EventoValidCnpj", "2.UsuarioInformaInfs", "2.UsuarioInformaInfsFull"].join(", "))
            console.log(contexts_name)
            console.log(filter_context)

            // Usuario ja possui optin cadastrado
            if (intent_response[0]["text"].indexOf("Gostaria de atualizá-los?") != -1) {
              let components = [
                {
                  "type": "body",
                  "parameters": [
                    { "type": "text", "text": telefone },
                    { "type": "text", "text": email }
                  ]
                },
                {
                  "type": "button",
                  "sub_type": "quick_reply",
                  "index": "0",
                  "parameters": []
                }
              ]
              intent_response = [{ "text": intent_response[0]["text"], "template": "sanofi_bot_optin_registered", "components": components, "transbordo_web": false }]
            }

            // Usuario não possui cadastro optin
            if (intent_response[0].text.indexOf("Gostaria de cadastrar os dados corporativos informados") != -1) {
              let components = [
                {
                  "type": "body",
                  "parameters": [
                    { "type": "text", "text": cnpj },
                    { "type": "text", "text": telefone },
                    { "type": "text", "text": email }
                  ]
                },
                {
                  "type": "button",
                  "sub_type": "quick_reply",
                  "index": "0",
                  "parameters": []
                }
              ]
              intent_response = [{ "text": intent_response[0]["text"], "template": "sanofi_bot_optin", "components": components, "transbordo_web": false }]
            }
          }

          if (["2.1.CadastroUsuarioOptin"].includes(intent_name)) {
            let contexts_name = contexts.map(el => el.name.split('/')[6])
            let filter_context = contexts_name.filter(el => el.indexOf("aguardando_infs_optin") != -1)

            console.log("2.1.CadastroUsuarioOptin")
            console.log(contexts_name)
            console.log(filter_context)

            if (filter_context.length <= 0) {
              let template = "sanofi_cad_optin"
              let components = [
                {
                  "type": "button",
                  "sub_type": "quick_reply",
                  "index": "0",
                  "parameters": []
                }
              ]
              intent_response = [{ "text": intent_response[0]["text"], "template": template, "components": components, "transbordo_web": false }]
            }
          }

          if (["2.1.2.UsuarioConfirmaCadOptin"].includes(intent_name)) {
            let contexts_name = contexts.map(el => el.name.split('/')[6])
            let filter_context = contexts_name.filter(el => el.indexOf("dialog_context") != -1)

            console.log("2.1.2.UsuarioConfirmaCadOptin")
            console.log(contexts_name)
            console.log(filter_context)

            let template = "sanofi_chatweb_menu"
            let components = [
              {
                "type": "button",
                "sub_type": "quick_reply",
                "index": "0",
                "parameters": []
              }
            ]

            if (intent_response[0].text.indexOf("Você gostaria de informar um novo e-mail e telefone, agora da farmácia?") != -1) {
              template = "sanofi_conf_cad_optin"
            }

            intent_response = [{ "text": intent_response[0]["text"], "template": template, "components": components, "transbordo_web": false }]
          }

          if (["2.1.EventoListaOpcoes"].includes(intent_name)) {
            let contexts_name = contexts.map(el => el.name.split('/')[6])
            let filter_context = contexts_name.filter(el => el.indexOf("dialog_context") != -1)

            console.log("2.1.2.UsuarioConfirmaCadOptin")
            console.log(contexts_name)
            console.log(filter_context)

            let template = "sanofi_chatweb_menu_fallback"
            let components = [
              {
                "type": "button",
                "sub_type": "quick_reply",
                "index": "0",
                "parameters": []
              }
            ]

            intent_response = [{ "text": intent_response[0]["text"], "template": template, "components": components, "transbordo_web": false }]
          }

          if (["2.1.AtualizaUsuarioOptin", "2.1.2.UsuarioInformaInfsOptin", "2.1.2.UsuarioConfirmaInfs"].includes(intent_name)) {
            // Usuario ira informar novos dados optin
            let contexts_name = contexts.map(el => el.name.split('/')[6])
            let filter_context = contexts_name.filter(el => el.indexOf("aguardando_infs_optin") != -1)

            console.log(["2.1.AtualizaUsuarioOptin", "2.1.2.UsuarioInformaInfsOptin", "2.1.2.UsuarioConfirmaInfs"].join(", "))
            console.log(contexts_name)
            console.log(filter_context)

            if (filter_context.length <= 0) {
              let template = "sanofi_chatweb_menu"
              let components = [
                {
                  "type": "button",
                  "sub_type": "quick_reply",
                  "index": "0",
                  "parameters": []
                }
              ]
              intent_response = [{ "text": intent_response[0]["text"], "template": template, "components": components, "transbordo_web": false }]
            }
          }

          if (["3.UsuarioInformaOpcaoNovoPedido", "2.UsuarioInformaTipoPedido", "3.EventoListaCondicao"].includes(intent_name)) {
            let link = `${webchat_url}/chat?session=${session}&opt=1`
            let webchat_text = `Muito legal saber que você quer fazer um pedido com a gente! Para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`

            await this.insert_log(session, mobile, webchat_text, 1)
            await this.update_params("opt", ["1", session])
            await this.update_status(session, 6)

            for (let i = 0; i < intent_response.length; i++) {
              const msg = intent_response[i];
              await this.insert_log(session, mobile, msg.text, 0, 0, 1)
            }

            let template = (segmento == "GEM") ? "sanofi_chatweb_gem_opt1" : "sanofi_chatweb_chc_opt1"
            let components = [
              {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                  {
                    "type": "text",
                    "text": `?session=${session}&opt=1`
                  }
                ]
              }
            ]
            intent_response = [{ "text": webchat_text, "template": template, "components": components, "transbordo_web": true }]
          }

          if (["4.EventoListOrders", "4.UsuarioInformaOpcaoConsultarPedido"].includes(intent_name)) {
            let link = `${webchat_url}/chat?session=${session}&opt=2`
            let webchat_text = `Vamos consultar o seu pedido agora! Mas para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`

            await this.insert_log(session, mobile, webchat_text, 1)
            await this.update_params("opt", ["2", session])
            await this.update_status(session, 6)

            for (let i = 0; i < intent_response.length; i++) {
              const msg = intent_response[i];
              await this.insert_log(session, mobile, msg.text, 0, 0, 1)
            }

            let template = (segmento == "GEM") ? "sanofi_chatweb_gem_opt2" : "sanofi_chatweb_chc_opt2"
            let components = [
              {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                  {
                    "type": "text",
                    "text": `?session=${session}&opt=2`
                  }
                ]
              }
            ]
            intent_response = [{ "text": webchat_text, "template": template, "components": components, "transbordo_web": true }]
          }

          if (["5.UsuarioInformaOpcaoOrcamento"].includes(intent_name)) {
            let link = `${webchat_url}/chat?session=${session}&opt=3`
            let webchat_text = `Muito legal saber que você quer fazer um pedido com a gente! Para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`

            await this.insert_log(session, mobile, webchat_text, 1)
            await this.update_params("opt", ["3", session])
            await this.update_status(session, 6)

            for (let i = 0; i < intent_response.length; i++) {
              const msg = intent_response[i];
              await this.insert_log(session, mobile, msg.text, 0, 0, 1)
            }

            let template = (segmento == "GEM") ? "sanofi_chatweb_gem_opt1" : "sanofi_chatweb_chc_opt1"
            let components = [
              {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                  {
                    "type": "text",
                    "text": `?session=${session}&opt=3`
                  }
                ]
              }
            ]
            intent_response = [{ "text": webchat_text, "template": template, "components": components, "transbordo_web": true }]
          }

          if (["9.UsuarioFinalizaContato"].includes(intent_name)) {
            intent_response = [{ "text": intent_response[0]["text"], "template": false, "transbordo_web": false }]
          }

          if (["9.1.FinalizaConversa"].includes(intent_name)) {
            await this.encerra_bot(session, mobile, true)
          }

          if (msgText["text"] == msgEnd) {
            await this.encerra_bot(session, mobile, true)
          }

          await this.update_session_context(session, JSON.stringify(contexts))
          await this.update_last_response(session, JSON.stringify(intent_response))

          resolve(intent_response)
        })
        .catch(async (error) => {
          console.error('Erro: ', error);
          await this.end_bot(session, mobile)
          resolve("null")
        });
    })
  }

  this.get_infs = function (sessionBot) {
    return new Promise(async (resolve, reject) => {
      let query = "SELECT cnpj, email, telefone, portal_gem, portal_chc FROM tab_filain WHERE sessionbot = ?"
      let params = [sessionBot]
      let result = await runDynamicQuery(query, params)
      resolve(result[0])
    })
  }

  this.get_last_response = function (sessionBot) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "SELECT last_response FROM tab_filain WHERE sessionBot = ?"
        let params = [sessionBot]
        let result = await runDynamicQuery(query, params)
        let last_response = JSON.parse(result[0]["last_response"])

        console.log(">> last_response: ", last_response)
        resolve(last_response)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.get_session_context = function (session) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "SELECT context FROM tab_filain WHERE sessionBot = ?"
        let params = [session]
        let result = await runDynamicQuery(query, params)
        let context = result[0]["context"]
        console.log(">> session_context: ", context)
        resolve(context)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.get_chat_history = function (sessionBot) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "SELECT DATE_FORMAT(dt,'%Y-%m-%d %H:%i:%s') as date, fromid, fromname, toid, toname, msgdir, msgtext, sessionid FROM tab_logs WHERE sessionid = ? ORDER by dt"
        let params = [sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(JSON.stringify(result))
      } catch (err) {
        reject(err)
      }
    })
  }

  this.get_transbordo_message = function (api_portal) {
    return new Promise((resolve, reject) => {
      try {
        // Obter a hora atual
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Criar objetos Date para os limites inferiores e superiores
        const lowerBound = new Date();
        lowerBound.setHours(10);
        lowerBound.setMinutes(0);

        const upperBound = new Date();
        upperBound.setHours(20);
        upperBound.setMinutes(0);

        // Verificar se o horário está entre os limites inferiores e superiores
        if (now.getDay() >= 1 && now.getDay() <= 5) {
          if (currentHour > lowerBound.getHours() ||
            (currentHour === lowerBound.getHours() && currentMinute >= lowerBound.getMinutes())) {

            if (currentHour < upperBound.getHours() ||
              (currentHour === upperBound.getHours() && currentMinute <= upperBound.getMinutes())) {

              resolve(TRANSBORDO_MESSAGE_1.replace("{portal}", api_portal))
            }
          }
        }

        resolve(TRANSBORDO_MESSAGE_2.replace("{portal}", api_portal))
      } catch (err) {
        reject(err)
      }
    })
  }

  this.update_params = function (intent, params) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = ""
        console.log(`>> Update params: ${intent} - ${params}`)
        if (["1.UsuarioInformaNome"].includes(intent)) {
          query = "UPDATE tab_filain SET name = ? where sessionBot = ?"
        }

        if (["2.EventoValidCnpj", "2.UsuarioInformaInfs", "2.UsuarioInformaInfsFull", "2.UsuarioInformaCnpj"].includes(intent)) {
          query = "UPDATE tab_filain SET cnpj = ?, email = ?, telefone = ?, name = ? where sessionBot = ?"
        }

        if (["opt"].includes(intent)) {
          query = "UPDATE tab_filain SET opt = ? where sessionBot = ?"
        }

        await runDynamicQuery(query, params)
        resolve()

      } catch (err) {
        reject(err)
      }
    })
  }

  this.update_status = function (sessionBot, status) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "UPDATE tab_filain SET status = ? WHERE sessionBot = ?"
        let params = [status, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.update_last_response = function (sessionBot, lastResponse) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "UPDATE tab_filain SET last_response = ? WHERE sessionBot = ?"
        let params = [lastResponse, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.update_session_context = function (sessionBot, context) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "UPDATE tab_filain SET context = ? WHERE sessionBot = ?"
        let params = [context, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.update_timeout_count = function (sessionBot, count) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "UPDATE tab_filain SET timeoutCount = ? WHERE sessionBot = ?"
        let params = [count, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.insert_transbordo = function (sessionBot, mobile) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "SELECT * FROM tab_transbordo where sessionBot = ?"
        let params = [sessionBot]
        let result = await runDynamicQuery(query, params)

        if (result.length <= 0) {
          let query1 = "INSERT INTO tab_transbordo (id,sessionBot,origem,telefone,cnpj,dtin) VALUES (uuid(),?,?,?,?,now())"
          let params1 = [sessionBot, 'wbot', mobile, "null"]
          await runDynamicQuery(query1, params1)
        }
        resolve(result)

      } catch (err) {
        reject(err)
      }
    })
  }

  this.encerra_indisponivel = function (sessionBot, mobile) {
    return new Promise(async (resolve, reject) => {
      try {
        let resultFila = await runDynamicQuery("SELECT * FROM tab_filain WHERE mobile=?", [mobile])

        var _sessionid = sessionBot;
        var _mobile = mobile;
        var _dtin = resultFila[0].dtin;
        var _dtat = new Date();
        var _name = resultFila[0].name || ''
        var _account = '';
        var _photo = '';
        var _fkto = '491b9564-2d79-11ea-978f-2e728ce88125';
        var _fkname = 'Bot';
        var _sessionBot = sessionBot;
        var _origem = 'wpp';
        var _cnpj = resultFila[0].cnpj || ''
        var _email = resultFila[0].email || ''
        var _telefone = resultFila[0].telefone || ''
        // var _status = -1 // Bot default
        var _status = 128 // Tentativa de Contato - Encerrado pelo BOT
        var _transfer = 0
        var _segmento = 'CHC'

        let query = "INSERT INTO tab_encerrain (sessionid, mobile, dtin, dtat, name, account, photo, fkto, fkname, status, transfer, cnpj, atendir, sessionBot, origem, email, telefone, segmento) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        let params = [_sessionid, _mobile, _dtin, _dtat, _name, _account, _photo, _fkto, _fkname, _status, _transfer, _cnpj, 'in', _sessionBot, _origem, _email, _telefone, _segmento]

        await runDynamicQuery(query, params)
        await runDynamicQuery("DELETE FROM tab_filain WHERE mobile=?", [mobile])

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  this.insert_log = function (sessionBot, mobile, message, status = 0, stread = 0, qr = 0) {
    return new Promise(async (resolve, reject) => {
      try {
        let chatHistory = this.get_chat_history(sessionBot)
        let query = "INSERT INTO tab_logs (id, sessionid, fromid, fromname, toid, toname, msgdir, msgtype, msgtext, status, stread, origem, qr) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        let params = [sessionBot, '491b9564-2d79-11ea-978f-2e728ce88125', 'Bot', mobile, '', 'o', 'chat', message, status, stread, 'wpp', qr]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.encerra_bot = function (sessionBot, mobile, journey) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "DELETE FROM tab_filain WHERE mobile = ?"
        let params = [mobile]
        let result = await runDynamicQuery(query, params)

        await this.encerra_transbordo(sessionBot)

        if (!journey) {
          await this.send_timeout(mobile, sessionBot)
        }

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.encerra_transbordo = function (sessionBot) {
    return new Promise(async (resolve, reject) => {
      try {
        let chatHistory = await this.get_chat_history(sessionBot)
        let query = "UPDATE tab_transbordo SET destino = 'wbot', chatbot = ?, dten = NOW() WHERE sessionBot = ?;"
        let params = [chatHistory, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.end_bot = function (sessionBot, mobile) {
    return new Promise(async (resolve, reject) => {
      try {
        let query = "UPDATE tab_filain SET status = 1 WHERE mobile = ?"
        let params = [mobile]
        let result = await runDynamicQuery(query, params)

        await this.end_transbordo(sessionBot)
        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.end_transbordo = function (sessionBot) {
    return new Promise(async (resolve, reject) => {
      try {
        let chatHistory = await this.get_chat_history(sessionBot)
        let query = "UPDATE tab_transbordo SET destino = 'human', chatbot = ? WHERE sessionBot = ?"
        let params = [chatHistory, sessionBot]
        let result = await runDynamicQuery(query, params)

        resolve(result)
      } catch (err) {
        reject(err)
      }
    })
  }

  this.bastion_bot_context = function (mobile, message, context, fallback, sessionBot, apiPortal) {
    return new Promise((resolve, reject) => {
      let contexts = {
        "welcome": () => {
          return new Promise(async (resolve, reject) => {
            try {
              let resposta_gem = await this.atos_detect_intent(sessionBot, 'oi', mobile, "GEM", true)
              // let resposta_chc = await this.atos_detect_intent(sessionBot, 'oi', mobile, "CHC")

              for (let i = 0; i < resposta_gem.length; i++) {
                const { text, transbordo_web } = resposta_gem[i];
                if (text != "null") {
                  if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }
                  await this.send_message(mobile, text)
                }
              }

              let query = "UPDATE tab_filain SET context='1.AguardandoInfs' WHERE sessionBot = ?"
              let params = [sessionBot]
              let result = await runDynamicQuery(query, params)
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        },
        "1.AguardandoEscolhaPortal": () => {
          return new Promise(async (resolve, reject) => {
            try {
              let gem_keywords = ["1 - prescrição / medley", "1", "prescrição sanofi", "prescrição", "webb", "genmed", "gem", "medley"]
              let chc_keywords = ["2 - otc sanofi", "2", "otc sanofi", "otc", "e-sanofi", "chc"]

              if (gem_keywords.includes(String(message).toLocaleLowerCase())) {
                let query = "UPDATE tab_filain SET status=5, context='1.1AtendimentoBotGem', segmento='GEM', fallback=0 WHERE sessionBot = ?"
                let params = [sessionBot]
                let result = await runDynamicQuery(query, params)

                let last_response = await this.get_last_response(sessionBot)
                for (let i = 0; i < last_response.length; i++) {
                  const { text, transbordo_web, template, components } = last_response[i];
                  if (text != "null") {
                    if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }

                    if (template && process.env.PROD == 'true') {
                      await this.send_template_message(mobile, template, components)
                    } else {
                      await this.send_message(mobile, text)
                    }
                  }

                }
              } else if (chc_keywords.includes(String(message).toLocaleLowerCase())) {
                let fallbackMessage = `Obrigada pelo seu interesse na compra de produtos OTC (Opella), porém este canal não está mais disponível para este portfólio.\nMas fique tranquilo(a), você pode realizar a sua compra com o nosso time do Conecta PDV (Televendas) pelo 0800 721 0100 ou diretamente pelo portal https://trade.fidelize.com.br/esanofi .\nPara seguir neste canal para a compra dos produtos de Prescrição Sanofi e Genéricos Medley, basta responder novamente com um “Oi” e selecionar o portfólio “1 - Prescrição / Medley”.\nAté logo!`

                await this.send_message(mobile, fallbackMessage)
                await this.insert_log(sessionBot, mobile, fallbackMessage)
                await this.encerra_indisponivel(sessionBot, mobile)


                resolve()

                let query = "UPDATE tab_filain SET status=5, context='1.1AtendimentoBotChc', segmento='CHC', fallback=0 WHERE sessionBot = ?"
                let params = [sessionBot]
                let result = await runDynamicQuery(query, params)

                let last_response = await this.get_last_response(sessionBot)
                for (let i = 0; i < last_response.length; i++) {
                  const { text, transbordo_web, template, components } = last_response[i];
                  if (text != "null") {
                    if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }

                    if (template && process.env.PROD == 'true') {
                      await this.send_template_message(mobile, template, components)
                    } else {
                      await this.send_message(mobile, text)
                    }
                  }
                }
              } else {
                if (fallback > 3) {
                  let fallbackMessage = await this.get_transbordo_message(apiPortal)
                  await this.send_message(mobile, fallbackMessage)
                  await this.insert_log(sessionBot, mobile, fallbackMessage)
                  await this.end_bot()
                } else {
                  let fallbackMessage = "Desculpe, não entendi"
                  await this.send_message(mobile, fallbackMessage)
                  await this.insert_log(sessionBot, mobile, fallbackMessage)
                }

                fallback = fallback + 1
                let query = "UPDATE tab_filain SET fallback=? WHERE sessionBot = ?"
                let params = [fallback, sessionBot]
                let result = await runDynamicQuery(query, params)
              }

              resolve()
            } catch (err) {
              reject(err)
            }
          })
        },
        "1.InformaNome": () => {
          return new Promise(async (resolve, reject) => {
            try {
              let resposta_gem = await this.atos_detect_intent(sessionBot, message, mobile, "GEM")
              // let resposta_chc = await this.atos_detect_intent(sessionBot, message, mobile, "CHC")

              for (let i = 0; i < resposta_gem.length; i++) {
                const { text, transbordo_web } = resposta_gem[i];
                if (text != "null") {
                  if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }
                  await this.send_message(mobile, text)
                }
              }

              let query = "UPDATE tab_filain SET context='1.AguardandoInfs' WHERE sessionBot = ?"
              let params = [sessionBot]
              let result = await runDynamicQuery(query, params)
              resolve()
            } catch (err) {
              reject(err)
            }
          })
        },
        "1.AguardandoInfs": () => {
          return new Promise(async (resolve, reject) => {
            try {
              let resposta_gem = await this.atos_detect_intent(sessionBot, message, mobile, "GEM")
              // let resposta_chc = await this.atos_detect_intent(sessionBot, message, mobile, "CHC")

              let { cnpj, email, telefone, portal_gem, portal_chc } = await this.get_infs(sessionBot)

              console.log(">> INFS: ")
              console.log(cnpj, email, telefone, portal_gem, portal_chc)

              let query, params, response;

              if (portal_gem == "1" && portal_chc == "1") {
                let template = "sanofi_bot_portal"
                let components = [
                  {
                    "type": "button",
                    "sub_type": "quick_reply",
                    "index": "0",
                    "parameters": []
                  }
                ]
                response = [{ "text": "Para agilizarmos o seu atendimento por favor escolha qual portal gostaria de acessar:\n\n1 - Prescrição / Medley\n2 - OTC Sanofi", "template": template, "components": components, "transbordo_web": false }]
                query = "UPDATE tab_filain SET context='1.AguardandoEscolhaPortal' WHERE sessionBot = ?"
                params = [sessionBot]

              } else if (portal_gem == "1") {
                response = resposta_gem
                query = "UPDATE tab_filain SET status=5, context='1.1AtendimentoBotGem', segmento='GEM', fallback=0 WHERE sessionBot = ?"
                params = [sessionBot]

              } else if (portal_chc == "1") {
                // response = resposta_chc
                query = "UPDATE tab_filain SET status=5, context='1.1AtendimentoBotChc', segmento='CHC', fallback=0 WHERE sessionBot = ?"
                params = [sessionBot]

                let fallbackMessage = `Obrigada pelo seu interesse na compra de produtos OTC (Opella), porém este canal não está mais disponível para este portfólio.\nMas fique tranquilo(a), você pode realizar a sua compra com o nosso time do Conecta PDV (Televendas) pelo 0800 721 0100 ou diretamente pelo portal https://trade.fidelize.com.br/esanofi .\nPara seguir neste canal para a compra dos produtos de Prescrição Sanofi e Genéricos Medley, basta responder novamente com um “Oi” e selecionar o portfólio “1 - Prescrição / Medley”.\nAté logo!`

                await this.send_message(mobile, fallbackMessage)
                await this.insert_log(sessionBot, mobile, fallbackMessage)
                await this.encerra_indisponivel(sessionBot, mobile)

                resolve()

              } else {
                response = resposta_gem
                fallback = fallback + 1
                query = "UPDATE tab_filain SET context='1.AguardandoInfs', fallback=? WHERE sessionBot=?"
                params = [fallback, sessionBot]
              }

              await runDynamicQuery(query, params)
              console.log(response)
              for (let i = 0; i < response.length; i++) {
                const { text, transbordo_web, template, components } = response[i];
                if (text != "null") {
                  if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }

                  if (template && process.env.PROD == 'true') {
                    await this.send_template_message(mobile, template, components)
                  } else {
                    await this.send_message(mobile, text)
                  }
                }
              }

              resolve()

            } catch (err) {
              reject(err)
            }
          })
        }
      }

      let context_function = (Object.keys(contexts).includes(context)) ? contexts[context] : contexts["welcome"]
      context_function().then(result => {
        resolve(result)
      }).catch(err => {
        reject(err)
      })
    })
  }

  this.bastion_new_messages = function (io, socket) {
    return new Promise(async (resolve, reject) => {
      try {
        let webchat_url, api_portal;
        let query = "SELECT mobile, sessionBot, TIMESTAMPDIFF(MINUTE,dtin,NOW()) as tempo, status, opt, fallback, timeoutCount, name, segmento, context, cnpj, email, telefone FROM tab_filain"
        let result = await runDynamicQuery(query, [])

        for (let i = 0; i < result.length; i++) {
          const { mobile, sessionBot, tempo, status, opt, fallback, timeoutCount, name, segmento, context, cnpj, email, telefone } = result[i];

          if (segmento) {
            webchat_url = (segmento == "GEM") ? WEBCHAT_URL_GEM : WEBCHAT_URL_CHC
            api_portal = API[segmento]["api_portal"]
          }

          // Status 4, waiting for portal
          if (status == 4) {
            let query1 = "SELECT msgtext, id, msgtype FROM tab_logs where fromid = ? AND sessionid = ? AND stread = 0  AND msgdir = 'i' ORDER BY dt DESC"
            let params1 = [mobile, sessionBot]
            let result1 = await runDynamicQuery(query1, params1)

            for (let j = 0; j < result1.length; j++) {
              const { id, msgtext, msgtype } = result1[j];
              await runDynamicQuery("UPDATE tab_logs SET stread = 1 WHERE id = ?", [id])

              if (context) {
                await this.bastion_bot_context(mobile, msgtext, context, fallback, sessionBot, api_portal)
              }
            }
          }
          // Status 5, wppbot service
          if (status == 5) {
            let query = "SELECT TIMESTAMPDIFF(MINUTE,dt,NOW()) as timeDiff FROM tab_logs where fromid = ? AND msgdir = 'i' AND sessionid = ? ORDER BY dt DESC LIMIT 1"
            let params = [mobile, sessionBot]
            let result = await runDynamicQuery(query, params)

            for (let i = 0; i < result.length; i++) {
              const { timeDiff } = result[i];
              if (timeDiff >= 20 && timeoutCount == 0) {
                // More than 20 minutes in the queue (wpp)
                let nameTimeout = (name) ? `Olá, ${name}.` : ""
                let msgOciosidade = `${nameTimeout} Ainda estou por aqui! Vamos continuar o seu atendimento? Mas caso deseja encerrá-lo digite “encerrar” a qualquer momento.`
                await this.send_message(mobile, msgOciosidade)
                await this.insert_log(sessionBot, mobile, msgOciosidade)
                await this.update_timeout_count(sessionBot, 1)

              } else if (timeDiff >= 40 && timeoutCount == 1) {
                // More than 40 minutes in the queue (wpp)
                let nameTimeout = (name) ? `${name},` : ""
                let msgOciosidade = `${nameTimeout} ainda estou por aqui e ficarei mais 15 minutinhos. Caso você não consiga prosseguir, encerrarei o nosso atendimento. Vamos continuar? Mas caso deseja encerrá-lo digite “encerrar” a qualquer momento.`
                await this.send_message(mobile, msgOciosidade)
                await this.insert_log(sessionBot, mobile, msgOciosidade)
                await this.update_timeout_count(sessionBot, 2)

              } else if (timeDiff >= 60 && timeoutCount == 2) {
                // More than 60 minutes in the queue (wpp)
                await this.update_timeout_count(sessionBot, 3)
                await this.encerra_bot(sessionBot, mobile, false)
                await runDynamicQuery("UPDATE tab_logs SET stread = 1 WHERE sessionid=?", [sessionBot])

              } else {
                await this.insert_transbordo(sessionBot, mobile)

                let query = "SELECT sessionid, msgtext, id, msgtype FROM tab_logs where fromid = ? AND sessionid = ? AND stread = 0  AND msgdir = 'i' ORDER BY dt DESC"
                let params = [mobile, sessionBot]
                let messages = await runDynamicQuery(query, params)

                for (let i = 0; i < messages.length; i++) {
                  const message = messages[i];
                  if (message.msgtype == "chat") {
                    let resposta = await this.atos_detect_intent(sessionBot, message.msgtext, mobile, segmento)
                    for (let j = 0; j < resposta.length; j++) {
                      const { text, transbordo_web, template, components } = resposta[j];
                      if (text != "null") {
                        if (!transbordo_web) { await this.insert_log(sessionBot, mobile, text) }

                        if (template && process.env.PROD == 'true') {
                          await this.send_template_message(mobile, template, components)
                        } else {
                          await this.send_message(mobile, text)
                        }
                      }
                    }

                    await runDynamicQuery("UPDATE tab_logs SET stread = 1 WHERE id=?", [message.id])

                  } else {
                    await this.end_bot(sessionBot, mobile)
                    await runDynamicQuery("UPDATE tab_logs SET stread = 1 WHERE id=?", [message.id])
                  }
                }
              }
            }
          }
          // Status 6, transfered to webchat
          if (status == 6) {
            let query = "SELECT TIMESTAMPDIFF(MINUTE,dt,NOW()) as timeDiff FROM tab_logs where fromid = ? AND msgdir = 'i' AND sessionid = ? ORDER BY dt DESC LIMIT 1"
            let params = [mobile, sessionBot]
            let result = await runDynamicQuery(query, params)

            for (let i = 0; i < result.length; i++) {
              const { timeDiff } = result[i];
              if (timeDiff < 60) {
                let query = "SELECT sessionid, msgtext, id, msgtype FROM tab_logs where fromid = ? AND sessionid = ? AND stread = 0  AND msgdir = 'i' ORDER BY dt DESC"
                let params = [mobile, sessionBot]
                let messages = await runDynamicQuery(query, params)

                for (let j = 0; j < messages.length; j++) {
                  const message = messages[j];
                  if (message.msgtype == "chat") {
                    await runDynamicQuery("UPDATE tab_logs SET stread = 2 WHERE id = ?", [message.id])

                    if (fallback == 0) {
                      let warningMsg = `Por favor continue o atendimento no link que enviamos para finalizar sua solicitação com nosso assistente virtual`

                      await this.send_message(mobile, warningMsg)
                      await this.insert_log(sessionBot, mobile, warningMsg, 2, 2)

                    } else {
                      let transbordoMsg = "Tudo bem, vou confirmar se tem alguém do nosso time disponível para te auxiliar... por favor aguarde..."
                      await this.send_message(mobile, transbordoMsg)
                      await this.insert_log(sessionBot, mobile, transbordoMsg, 2, 2)
                      await this.update_status(sessionBot, 1)
                    }
                  }

                }
              } else {
                await this.encerra_bot(sessionBot, mobile, true)
                await runDynamicQuery("UPDATE tab_logs SET stread = 1 WHERE sessionid = ?", [sessionBot])
              }
            }
          }

        }

        resolve("")

      } catch (err) {
        reject(err)
      }
    })
  }
}