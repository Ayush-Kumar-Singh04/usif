#include "packet_builder.h"

String buildJsonPayload(const String& id, float value) {
    return "{\"sensor_id\":\"" + id + "\",\"value\":" + String(value) + ",\"raw_value\":" + String(value) + "}";
}
