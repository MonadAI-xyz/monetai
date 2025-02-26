import auth from './auth';
import basicInfo from './basicInfo';
import components from './components';
import servers from './servers';
import tags from './tags';

export default {
  ...basicInfo,
  ...servers,
  ...components,
  ...tags,
  paths: {
    ...auth.paths,
  },
};
