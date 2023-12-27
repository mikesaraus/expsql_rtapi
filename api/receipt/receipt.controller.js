const _ = process.env,
  PDFDocument = require('pdfkit'),
  { formatMoney } = require('../../lib/fn/fn.format.js'),
  transaction = require('../transactions/trans.service.js'),
  user = require('../users/user.service.js'),
  company = require('../company/company.service.js'),
  getObj = require('lodash.get'),
  { errorJsonResponse } = require('../../lib/fn/fn.db')

module.exports = {
  generateReceipt: (req, res) => {
    const data = { ...req.query, ...req.params }
    const verified = req.headers.verified
    if (!data.trans_id && (!verified || !getObj(verified, 'data.position').toLowerCase().includes('admin'))) {
      console.error('Error Generating Receipt:', 'No Transaction Found')
      return res.json(errorJsonResponse({ detail: 'No Transaction Found' }))
    } else
      company.service_view({}, (e, comp) => {
        if (e) return res.json(errorJsonResponse(e))
        if (!getObj(comp, 'rowCount')) return res.json(errorJsonResponse({ detail: 'Failed to Get Company Details' }))
        const info = comp.rows[0]
        transaction.service_view(
          {
            trans_id: data.trans_id,
          },
          (err, results) => {
            if (err) {
              console.error('Failed Generating Receipt:', JSON.stringify(err))
              return res.json(errorJsonResponse(err))
            }
            if (typeof data.header === 'undefined' || data.header != 'false') data.header = true
            if (typeof data.footer === 'undefined' || data.footer != 'false') data.footer = true
            const trans_data = results ? results.rows || [] : []
            if (!trans_data.length) return res.json(errorJsonResponse({ detail: 'Transaction Not Found' }))
            let receivers = Array.from(new Set(trans_data.map((e) => e.receiver_id || null)))
            user.service_view({ userid: receivers.join('||') }, (u_err, res_usr) => {
              if (u_err) {
                console.error('Failed to Get Receivers Information:', JSON.stringify(u_err))
              }
              console.log('Receipt Generated for Transaction/s:', data.trans_id)
              const users = {}
              getObj(res_usr, 'rows', []).forEach((u) => (users[u.userid] = u))
              const download = data.download !== undefined
              const today = new Date(Date.now())

              const logoLoc = './public/favicon.png'
              let { title, creator, author, producer, subject, keywords } = data
              title = title
                ? title
                : `${info.name_abbr}_` + (trans_data.length == 1 ? `${trans_data[0].trans_id}` : `${today.valueOf()}`)
              creator = creator ? creator : `${info.name_short}`
              author = author ? author : `${info.name_short}`
              producer = producer ? producer : `${info.name_short}`
              subject = subject ? subject : `${info.name_short}`
              keywords = keywords ? keywords : `${info.name_short}`

              const doc = new PDFDocument({
                layout: 'portrait',
                size: [684, 396], // [850, 550],
                font: 'Helvetica',
                // margin: 20,
                margins: { top: 30, left: 20, right: 20, bottom: 30 },
                info: {
                  Title: title,
                  Creator: creator,
                  Author: author,
                  Producer: producer,
                  Subject: subject,
                  Keywords: keywords,
                  CreationDate: trans_data.length == 1 ? new Date(trans_data[0].date_paid) : today,
                  ModDate: today,
                },
              })

              trans_data.forEach((trans, i) => {
                // Content Header
                const trans_receipt_url = `http${getObj(req, 'secure') ? 's' : ''}://${getObj(
                  req,
                  'headers.host'
                )}${getObj(req, 'client.parser.incoming.baseUrl', '')}/${trans.trans_id}`
                const offset = 20
                let font_size = 8,
                  x = doc.page.margins.left + offset,
                  y = doc.page.margins.top,
                  second_half = Math.round(Number(doc.page.width) / 2)
                if (data.header == 'true' || data.header === true)
                  doc
                    // column 1
                    .image(logoLoc, x, y, {
                      fit: [30, 30],
                      align: 'center',
                      valign: 'center',
                    })
                    .link(x, y, 30, 30, `${info.website}`)
                    .fontSize((font_size = 9))
                    .text(String(info.name).substring(0, info.name_short.length).toUpperCase(), (x += 40), (y += 7))
                    .fontSize((font_size = 7.5))
                    .text(String(info.name).substring(info.name_short.length + 1), x, (y += font_size + 2))

                    // column 2
                    .fontSize((font_size = 8))
                    .text(`${info.address_1}`, (x += 120), (y = doc.page.margins.top))
                    .text(`${info.address_2}`, x, (y += font_size + 2))
                    .text(`VAT REG. TIN ${info.tin}`, x, (y += font_size + 2))

                    // column 3
                    .text(`Tel. No.: ${info.phone}`, (x += 160), (y = doc.page.margins.top))
                    .link(x + 30, y, 120, font_size, `tel:${info.phone}`)
                    .text(`Website: ${info.website}`, x, (y += font_size + 2))
                    .link(x + 35, y, 115, font_size, `${info.website}`)
                    .text(`Email: ${info.email}`, x, (y += font_size + 2))
                    .link(x + 25, y, 123, font_size, `mailto:${info.email}`)

                    // column 4
                    .image(logoLoc, (x += 160), (y = doc.page.margins.top), {
                      fit: [30, 30],
                      align: 'center',
                      valign: 'center',
                    })
                    .link(x, y, 30, 30, trans_receipt_url)
                    .fontSize((font_size = 9))
                    .text(String(info.name).substring(0, info.name_short.length).toUpperCase(), (x += 40), (y += 7))
                    .fontSize((font_size = 7.5))
                    .text(String(info.name).substring(info.name_short.length + 1), x, (y += font_size + 2))

                    // Header Line Separator
                    .opacity(0.5)
                    .lineCap()
                    .moveTo(doc.page.margins.left, (y += 20))
                    .lineTo(doc.page.width - doc.page.margins.right, y)
                    .stroke('#c0c0c0')
                    // Vertical
                    .opacity(0.25)
                    .lineCap('butt')
                    .dash(10, { space: 1 })
                    .moveTo(second_half, 70)
                    .lineTo(second_half, doc.page.height)
                    .stroke('#c0c0c0')
                    .opacity(1)
                else y = doc.page.margins.top + 40

                // Calculate Total Paid
                let totalPaid = Number(trans.amount_paid) + Number(trans.trans_fee)

                // BODY
                // Left Side
                doc
                  .fontSize((font_size = 9))

                  // Account ID
                  .text('Account ID', (x = doc.page.margins.left + offset), (y += 10))
                  .text(':', x + 100, y)
                  .text(`${trans.account_id}`, x + 120, y)

                  // Name
                  .text('Name', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${trans.account_name}`, x + 120, y, { width: 175 })

                  // Payment Method
                  .text('Payment Method', x, (y += font_size * 2 + 10))
                  .text(':', x + 100, y)
                  .text(
                    `${trans.paymethod}${
                      trans.check_bank && trans.check_no ? ' - ' + trans.check_bank + ' (' + trans.check_no + ')' : ''
                    }`,
                    x + 120,
                    y
                  )

                  // Date Paid
                  .text('Date', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${new Date(trans.date_paid).toString().replace(/ GMT.+/, '')}`, x + 120, y)

                  // Transaction Id
                  .text('Transaction Id', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${trans.trans_id}`, x + 120, y)
                  .link(x + 120, y, 150, font_size, trans_receipt_url)

                  // Received By
                  .text('Received by', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(
                    users[trans.receiver_id]
                      ? `${getObj(users[trans.receiver_id], 'firstname', '_').charAt(0)}.${getObj(
                          users[trans.receiver_id],
                          'lastname',
                          '_'
                        )}`
                      : trans.receiver_id,
                    x + 120,
                    y
                  )

                doc
                  .fontSize((font_size = 9))

                  // REPRINTED
                  .text('REPRINTED', x, y + 50)

                  // VAT Sales
                  .text('VAT Sales', (x += 100), (y += font_size + 10))
                  .text(`${formatMoney(totalPaid)}`, x + 125, y)

                  // Non-VAT Sales
                  .text('Non-VAT Sales', x, (y += font_size + 7))
                  .text(`${formatMoney(0)}`, x + 125, y)

                  // VAT Zero Sales
                  .text('VAT Zero Related Sales', x, (y += font_size + 7))
                  .text(`${formatMoney(0)}`, x + 125, y)

                  // VAT Amount
                  .text('VAT Amount', x, (y += font_size + 7))
                  .text(`${formatMoney(0)}`, x + 125, y)

                  // BIR 2306
                  .text('BIR 2306', x, (y += font_size + 7))
                  .text(`${formatMoney(0)}`, x + 125, y)

                  // BIR 2307
                  .text('ADVANCE', x, (y += font_size + 7))
                  .text(`${formatMoney(0)}`, x + 125, y)

                  // Total
                  .text('Total', x, (y += font_size + 7))
                  .text(`${formatMoney(totalPaid)}`, x + 125, y)

                  // Amount Received
                  .text('Amount Received', x, (y += font_size + 7))
                  .text(`${formatMoney(trans.amount_received)}`, x + 125, y)

                  // Amount Change
                  .text('Amount Change', x, (y += font_size + 7))
                  .text(`${formatMoney(trans.amount_received - totalPaid)}`, x + 125, y)

                font_size = 8
                x = second_half
                y = doc.page.margins.top + 40

                // Right Side
                doc
                  .fontSize((font_size = 8))
                  // Customers Copy
                  .opacity(0.25)
                  .text('Customers Copy', x * 2 - 100, (y += 7))
                  .opacity(1)

                  // Account Idoffset
                  .text('Account Id', (x += offset), (y += font_size + 10))
                  .text(':', x + 100, y)
                  .text(`${trans.account_id}`, x + 120, y)

                  // Name
                  .text('Name', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${trans.account_name}`, x + 120, y, { width: 175 })

                  // Payment Method
                  .text('Payment Method', x, (y += font_size * 2 + 10))
                  .text(':', x + 100, y)
                  .text(
                    `${trans.paymethod}${
                      trans.check_bank && trans.check_no ? ' - ' + trans.check_bank + ' (' + trans.check_no + ')' : ''
                    }`,
                    x + 120,
                    y
                  )

                  // Date Paid
                  .text('Date', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${new Date(trans.date_paid).toString().replace(/ GMT.+/, '')}`, x + 120, y)

                  // Transaction Id
                  .text('Transaction Id', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(`${trans.trans_id}`, x + 120, y)
                  .link(x + 120, y, 150, font_size, trans_receipt_url)

                  // Received By
                  .text('Received by', x, (y += font_size + 7))
                  .text(':', x + 100, y)
                  .text(
                    users[trans.receiver_id]
                      ? `${getObj(users[trans.receiver_id], 'firstname', '_').charAt(0)}.${getObj(
                          users[trans.receiver_id],
                          'lastname',
                          '_'
                        )}`
                      : trans.receiver_id,
                    x + 120,
                    y
                  )

                  // REPRINTED
                  .text('REPRINTED', x, y + 50 - font_size - 7)

                  // VAT Sales
                  .text('VAT Sales', (x += 100), (y += font_size + 10))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(totalPaid)}`, x + 135, y)

                  // Non-VAT Sales
                  .text('Non-VAT Sales', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(0)}`, x + 135, y)

                  // VAT Zero Sales
                  .text('VAT Zero Related Sales', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(0)}`, x + 135, y)

                  // VAT Amount
                  .text('VAT Amount', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(0)}`, x + 135, y)

                  // BIR 2306
                  .text('BIR 2306', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(0)}`, x + 135, y)

                  // BIR 2307
                  .text('ADVANCE', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(0)}`, x + 135, y)

                  // Total
                  .text('Total', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(totalPaid)}`, x + 135, y)

                  // Amount Received
                  .text('Amount Received', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(trans.amount_received)}`, x + 135, y)

                  // Amount Change
                  .text('Amount Change', x, (y += font_size + 7))
                  .text(':', x + 120, y)
                  .text(`${formatMoney(trans.amount_received - totalPaid)}`, x + 135, y)

                // Footer
                if (data.footer == 'true' || data.footer === true)
                  doc
                    .fontSize((font_size = 8))
                    .fillOpacity(0.5)

                    // Left Side
                    .text(
                      'THIS IS A SYSTEM GENERATED ACKNOWLEDGEMENT RECEIPT.',
                      (x = doc.page.margins.left + 15),
                      (y = doc.page.height - 55)
                    )
                    .text(
                      `CAS#: ${trans.trans_id} On: ${new Date(trans.date_paid).toLocaleDateString()} Series: ${new Date(
                        trans.date_paid
                      ).getFullYear()}`,
                      x,
                      (y += font_size + 5)
                    )
                    // Right Side
                    .fontSize((font_size = 7))
                    .text(
                      'THIS IS A SYSTEM GENERATED ACKNOWLEDGEMENT RECEIPT.',
                      (x = second_half + offset),
                      (y = doc.page.height - 55)
                    )
                    .text(
                      `CAS#: ${trans.trans_id} On: ${new Date(trans.date_paid).toLocaleDateString()} Series: ${new Date(
                        trans.date_paid
                      ).getFullYear()}`,
                      x,
                      (y += font_size + 5)
                    )
                    .fillOpacity(1)

                if (i + 1 < trans_data.length) doc.addPage()
              })

              filename = encodeURIComponent(title) + '.pdf'

              // PDF Header
              res.setHeader('Content-disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`)
              res.setHeader('Content-type', 'application/pdf')
              doc.pipe(res)
              doc.end()
            })
          }
        )
      })
  },
}
