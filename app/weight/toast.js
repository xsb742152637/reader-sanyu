/*
 * description: the weight of toast
 * author: 神编小码
 * time: 2018年04月10日09:19:22
 */

import Toast from 'react-native-root-toast'

var toast = null

module.exports = {
  toastShort: (message) => {
    this.toast && this.toast.destroy()
    this.toast = Toast.show(message, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        shadow: false,
        animation: true,
        hideOnPress: false,
        delay: 0,
        onHidden: () => {
            this.toast.destroy()
            this.toast = null
        }
    })
  },
  toastLong: (message) => {
    this.toast && this.toast.destroy()
    this.toast = Toast.show(message, {
        duration: Toast.durations.Long,
        position: Toast.positions.BOTTOM,
        shadow: false,
        animation: true,
        hideOnPress: false,
        delay: 0,
        onHidden: () => {
            this.toast.destroy()
            this.toast = null
        }
    })
  }
}
