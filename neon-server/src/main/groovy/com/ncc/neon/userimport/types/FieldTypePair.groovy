/*
 * Copyright 2015 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package com.ncc.neon.userimport.types

import groovy.transform.ToString

/**
 * Simple container that holds a field name and the type of data associated with that field name.
 */
@ToString(includeNames = true)
public class FieldTypePair {
    String name
    FieldType type
    // If FieldType is OBJECT, objectFTPairs is a list of FieldTypePair objects for this object's values
    List<FieldTypePair> objectFTPairs
}