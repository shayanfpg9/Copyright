function response({ req, error, ...props }) {
  if (req === undefined) {
    req = {};
  }

  props.status = props.status || req.statusCode || 404;

  const result = {
    method: req?.headers?.upgrade ? "ٌWebsocket" : req?.method,
    path: req?.path || req.headers.host,
    status: props.status,
    action: props?.action?.replaceAll(" ", "-")?.toUpperCase(),
    error: error ?? false,
    debug: {
      params: req?.params,
      body: req?.body,
      cookies: req?.cookies,
      query: req?.query,
      message: req?.message,
    },
  };

  if (error) {
    result.data = {
      title: props?.title || "Error: " + props.status,
      message: props?.message || req?.statusMessage,
      errors: props?.data,
    };
  } else {
    result.data = props.data;
  }

  return {
    result,
    rest: (res) => {
      res.status(props.status).json(result);
      res.end();
    },
    ws: (ws) => {
      ws.send(JSON.stringify(result));
    },
  };
}

module.exports = response;
