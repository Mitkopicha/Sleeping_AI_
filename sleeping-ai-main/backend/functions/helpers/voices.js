const CATALOG = [
  {
    id: "en-GB-Standard-A",
    languageCode: "en-GB",
    ssmlGender: "FEMALE",
    name: "en-GB-Standard-A",
    label: "UK Female (Standard A)",
  },
  {
    id: "en-GB-Standard-B",
    languageCode: "en-GB",
    ssmlGender: "MALE",
    name: "en-GB-Standard-B",
    label: "UK Male (Standard B)",
  },

  {
    id: "en-GB-Wavenet-A",
    languageCode: "en-GB",
    ssmlGender: "FEMALE",
    name: "en-GB-Wavenet-A",
    label: "UK Female (Wavenet A)",
  },
  {
    id: "en-GB-Wavenet-B",
    languageCode: "en-GB",
    ssmlGender: "MALE",
    name: "en-GB-Wavenet-B",
    label: "UK Male (Wavenet B)",
  },
  {
    id: "en-US-Standard-C",
    languageCode: "en-US",
    ssmlGender: "FEMALE",
    name: "en-US-Standard-C",
    label: "US Female (Standard C)",
  },
  {
    id: "en-US-Standard-D",
    languageCode: "en-US",
    ssmlGender: "MALE",
    name: "en-US-Standard-D",
    label: "US Male (Standard D)",
  },
];

/**
 * Resolve a voice from the catalog.
 *
 * @param {Object} opts
 * @param {string=} opts.voiceId       Preferred voice ID or name
 * @param {string=} opts.voiceGender   FEMALE | MALE
 * @return {Object}                    A matching voice config
 */
function resolveVoice(opts = {}) {
  const { voiceId, voiceGender = "FEMALE" } = opts;

  // Exact match by id or name
  if (voiceId) {
    const found = CATALOG.find((v) => v.id === voiceId || v.name === voiceId);
    if (found) return found;
  }

  // UK voice by gender
  const gb = CATALOG.find(
    (v) => v.languageCode === "en-GB" && v.ssmlGender === voiceGender
  );
  if (gb) return gb;

  // First entry in catalog
  return CATALOG[0];
}

module.exports = { CATALOG, resolveVoice };

