import { registerWebSite, Living, PollError, PollErrorType } from '../types'
import { mapFilter } from '~/utils'

interface Room {
  title: string
  liveTime: number
  nickname: string
  online: number
  keyframe: string
  link: string
}
interface Response {
  code: number
  data: {
    rooms: Room[]
    count: number
  }
  need_login?: number
}

function getInfoFromItem ({
  title,
  liveTime,
  nickname,
  online,
  keyframe,
  link
}: Room): Living | undefined {
  return {
    title,
    startAt: liveTime,
    author: nickname,
    online,
    preview: keyframe,
    url: link
  }
}

registerWebSite({
  async getLiving () {
    const r = await fetch(`https://api.live.bilibili.com/relation/v1/Feed/getList`)
    const res: Response = await r.json()
    const count: number = res.data.count;

    for (let page = 2; page <= (count / 10) + 1; page++) {
      const list: Response = await (await fetch(`https://api.live.bilibili.com/relation/v1/Feed/getList?page=` + page)).json()
      res.data.rooms = res.data.rooms.concat(list.data.rooms)
    }

    // not login
    if (res.code === 10004 || res.code === 401 || res.need_login === 1) {
      throw new PollError(PollErrorType.NotLogin)
    }
    if (res.data.rooms === undefined) {
      throw new PollError(PollErrorType.Other)
    }

    return mapFilter(res.data.rooms, getInfoFromItem)
  },
  id: 'bilibili',
  homepage: 'https://live.bilibili.com/'
})
