import * as functions from 'firebase-functions'
import OrchestratorApi from 'uipath-orchestrator-api-node'
import request from 'request'
import moment from 'moment-timezone'

const sendSlack = (message: string) => {
    const option = {
        url: 'https://hooks.slack.com/services/xxxxxxx',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: { text: message, channel: '#general' }
    }
    request(option)
}

const executeLogic = async () => {
    const config = {
        "userinfo": {
            "tenancyName": "default",
            "usernameOrEmailAddress": "admin",
            "password": "xxxxxx"
        },
        "serverinfo": {
            "servername": "https://www.example.com/"
        }
    }
    // const config = {
    //     "serverinfo": {
    //         "servername": "https://platform.uipath.com/[AccountLogicalName]/[ServiceName]",
    //         "refresh_token": "[User Key]",
    //         "tenant_logical_name": "[Tenant Logical Name]",
    //         "client_id": "[Client Id]]"
    //     }
    // }

  const api = new OrchestratorApi(config)
  // まずは認証
  await api.authenticate()

  const li = await api.license.find()
  const allowed = li.Allowed
  const used = li.Used

  const now = moment() // UTCやJSTで作成された時刻を、tz('Asia/Tokyo')で TokyoのTimezoneの時刻に変換
  let message: string = now.tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm')
  // 上記でTokyoの日時に変換もしくは、環境変数にTZを指定する

  // https://thr3a.hatenablog.com/entry/20190417/1555510726
  // http://watanabeyu.blogspot.com/2019/10/firebase-functionsdate9.html

  message += ` 時点の ${config.serverinfo.servername} のライセンス情報です。\n`

  for (const prop in allowed) {
    message += `${prop}: ${used[prop]} / ${allowed[prop]}\n`
  }
  message += `AttendedConcurrent: ${li.AttendedConcurrent}\n`
  message += `DevelopmentConcurrent: ${li.DevelopmentConcurrent}\n`
  message += `StudioXConcurrent: ${li.StudioXConcurrent}\n`
  sendSlack(message)
  return li
}

// export const checkLicense = functions.https.onRequest(async (req, response) => {
//   const license = await executeLogic()
//   response.json(license)
// })

export const checkLicensePubSub = functions.pubsub
  // .schedule('0 */1 * * *')
  .schedule('0 18 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async context => {
    await executeLogic()
  })
