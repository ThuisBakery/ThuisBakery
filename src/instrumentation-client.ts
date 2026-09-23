import { initBotId } from 'botid/client/core'

import { ENQUIRY_ENDPOINT } from '@/domain/submit-enquiry'

/**
 * BotID Basic on the one route worth a bot's while (ADR-0006): it attaches its invisible
 * challenge to every `POST` the Enquiry form makes, and the route's `checkBotId()` reads it.
 * No other request carries it, so no other page pays for it.
 */
initBotId({
  protect: [{ path: ENQUIRY_ENDPOINT, method: 'POST' }],
})
