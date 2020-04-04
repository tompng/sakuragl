export function loadFileSync(path: string) {
  const req = new XMLHttpRequest()
  req.open('get', path, false)
  req.send()
  return req.responseText
}
