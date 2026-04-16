import api from './axiosInstance';
import adminApi from './adminAxios';

/**
 * Universal API caller.
 *
 * @param {object} options
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} options.method  - HTTP method
 * @param {string}  options.endpoint  - e.g. '/api/order'
 * @param {object}  [options.params]  - Query params (always appended to URL)
 * @param {object}  [options.payload] - Request body (POST / PUT / PATCH)
 * @param {boolean} [options.useAdmin=false] - Use admin axios instance
 * @returns {Promise<any>} response.data
 */
export async function apiCaller({
  method = 'GET',
  endpoint,
  params,
  payload,
  useAdmin = false,
  responseType,
}) {
  const instance = useAdmin ? adminApi : api;
  const upperMethod = method.toUpperCase();

  const config = {
    method: upperMethod,
    url: endpoint,
    ...(params ? { params } : {}),
    ...(responseType ? { responseType } : {}),
  };

  // Attach body for mutating methods
  if (['POST', 'PUT', 'PATCH'].includes(upperMethod) && payload !== undefined) {
    config.data = payload;
  }

  const response = await instance(config);
  return responseType ? response : response.data;
}
