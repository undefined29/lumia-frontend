import { renderImageOg } from '../../_lib/og.js'

export const onRequestGet = (context) => renderImageOg(context, context.params.id)
